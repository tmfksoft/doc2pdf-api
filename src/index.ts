import Hapi from '@hapi/hapi';
import Joi from 'joi';

import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import HapiFile from './interfaces/HapiFile';

const manifest = require('../package.json');

class DOC2PDF {

	Server: Hapi.Server;
	outDir = path.join(__dirname, "..", "out");

	constructor() {
		this.Server = new Hapi.Server({
			port: process.env.PORT || 8080
		});

		if (!fs.existsSync(this.outDir)) {
			fs.mkdirSync(this.outDir);
		}
	}

	async registerRoutes() {
		this.Server.route({
			method: "GET",
			path: "/",
			handler: async (req, h) => {
				const version = execSync('doc2pdf --version');
				return {
					apiVersion: manifest.version,
					doc2pdfVersion: version.toString().split('\n').filter(l => l !== ""),
				};
			}
		});

		this.Server.route({
			method: "POST",
			path: "/convert",
			options: {
				validate: {
					payload: Joi.object({
						file: Joi.any().required()
					}),
				},
				payload: {
					output: 'stream',
					parse: true,
					allow: 'multipart/form-data',
					multipart: {
						output: 'file',
					},
				},
			},
			handler: async (req, h) => {
				const payload = req.payload as {
					file: HapiFile,
				};

				const destPath = path.join(this.outDir, `${uuidv4()}.pdf`);
				const command = `doc2pdf -o ${destPath} ${payload.file.path}`;

				// Blindly convert it
				execSync(command);

				// Clean up original
				fs.unlinkSync(payload.file.path);

				const stream = fs.createReadStream(destPath);

				stream.on('close', () => {
					fs.unlinkSync(destPath);
				});
				stream.on('error', () => {
					fs.unlinkSync(destPath);
				});

				return h.response(stream).type("application/pdf");
			}
		});
	}

	async start() {
		await this.registerRoutes();
		await this.Server.start();
	}
}

const API = new DOC2PDF();
API.start();