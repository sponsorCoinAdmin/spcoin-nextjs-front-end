import { createSerializedHandler } from '../../readMethodRuntime';
const handler = createSerializedHandler({
    method: 'getSerializedSPCoinHeader',
    localMethod: 'getSPCoinHeaderRecord',
    localArgs: () => [false],
});
export default handler;
