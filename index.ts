import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

import * as cheerio from "cheerio";
import axios from "axios";

/**
 *
 * Setup AWS SDK
 * Allow to save files to S3
 * */
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Create Bucket name in S3
const BUCKET = "lambda-url-to-html-s3";
const s3Client = new S3Client({ region: "us-west-1" });

export const storage = {
  storeHtmlFile: async (content: string, name: string): Promise<string> => {
    const key = `${name}.html`;
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: Buffer.from(content),
      ContentType: "text/html",
    });
    await s3Client.send(command);
    return `http://${BUCKET}.s3.amazonaws.com/${key}`;
  },
};

export interface Input {
  url: string;
  name: string;
}

export interface Output {
  title: string;
  s3_url: string;
  error: string;
}

export const handler = async (
  event: Partial<APIGatewayProxyEventV2>
): Promise<APIGatewayProxyStructuredResultV2> => {
  const output: Output = {
    title: "",
    s3_url: "",
    error: "",
  };

  try {
    const body = event.queryStringParameters as unknown as Input;

    if (!body?.name || !body?.url) {
      throw new Error("name and url are required");
    }

    const res = await axios.get(body.url);
    output.title = cheerio.load(res.data)("head > title").text();
    output.s3_url = await storage.storeHtmlFile(res.data, body.name);
  } catch (err) {
    output.error = err.message;
    console.log(err);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(output),
  };
};
