# Use the official Node.js image as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files first
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Install Python (if it's not already included in the Node image)
RUN apt-get update && apt-get install -y python3 python3-pip

# Copy requirements.txt and install Python dependencies
COPY requirements.txt ./
RUN pip install -r requirements.txt

# Copy the rest of the application files into the working directory
COPY . .

# Expose the port that your application runs on (optional, if you want to expose a port)
EXPOSE 3000

# Define the entry point for the container
CMD ["node", "server.js"]