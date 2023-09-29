FROM node:20.0.0

RUN apt-get update
RUN apt-get install -y unoconv


# Create our user
RUN useradd -r -d /data app

# Create our directory (Prev command may create this)
RUN mkdir /data && chown -R app:app /data

# Copy in API and UI files
COPY --chown=app:app . /data

# Drop into the users environment
USER app

# Set the current working directory
WORKDIR /data

# Install dependencies and build the API
RUN yarn install
RUN yarn build

# Set the NodeJS Environment
ENV NODE_ENV=production

# Start command
CMD [ "yarn", "start" ]

# Expose our default port.
EXPOSE 8080