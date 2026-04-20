declare const handler: {
    method: string;
    run: (context: import("../../readMethodRuntime").ReadMethodHandlerContext) => Promise<unknown>;
};
export default handler;
