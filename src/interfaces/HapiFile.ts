export default interface HapiFile {
	filename: string,
	bytes: number,
	path: string,
	headers?: { [key: string]: string }
}