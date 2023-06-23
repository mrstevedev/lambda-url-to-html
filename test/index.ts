import { APIGatewayProxyEventV2 } from "aws-lambda";
import { describe, it, afterEach } from "mocha";
import { handler, Input, Output, storage } from "../index";
import { stub, restore } from "sinon";
import { strictEqual } from "assert";
import axios from "axios";

const executeLambda = async (
  url: string,
  name: string
): Promise<Output | null> => {
  const output = await handler({ queryStringParameters: { url, name } });
  let outputBody: Output | null = null;
  if (output) {
    outputBody = JSON.parse(output.body as string);
  }
  return outputBody;
};

const name = "__file_name__";
const s3UrlFile = "http://s3fileUrl.com";
const title = "This is the title of webapps.sandiego.gov/sdfiredispatch";

afterEach(restore);

describe("handler", () => {
  it("should get the html from a url", async () => {
    stub(axios, "get").resolves({
      data: `<html><head><title>${title}</title></head></html>`,
    });
    stub(storage, "storeHtmlFile").resolves(s3UrlFile);
    const output = await executeLambda(
      "https://webapps.sandiego.gov/sdfiredispatch/",
      name
    );
    // console.log({ output });
    strictEqual(output?.s3_url, s3UrlFile);
  });
  it("should extract and return the page title of a url", async () => {
    const html = `<html><head><title>${title}</title></head></html>`;
    stub(axios, "get").resolves({
      data: html,
    });
    const storeHtmlFile = stub(storage, "storeHtmlFile").resolves(s3UrlFile);
    const output = await executeLambda(
      "https://webapps.sandiego.gov/sdfiredispatch/",
      name
    );
    strictEqual(output?.title, title);
    strictEqual(storeHtmlFile.calledOnceWith(html, name), true);
  });
});
