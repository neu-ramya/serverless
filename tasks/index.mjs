import uploadToGCP from "./gcp.mjs";

export const handler = async (event, context) => {
  try {
    console.log("1. Starting handler");
    const gcpResponse = await uploadToGCP(
      "https://codeload.github.com/tparikh/myrepo/zip/refs/tags/v1.0.0"
    );

    console.log('COMPLETING LAMBDA EXECUTION');
  } catch (error) {
    console.error("Error in handler:", error);
  }
};
