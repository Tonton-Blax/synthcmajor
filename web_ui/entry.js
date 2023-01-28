import Test from "./index.svelte";
export default function createCustomPatchView (patchConnection)
{
    return new Test({
        target: document.body,
        props: { patch : patchConnection },
        //context: new Map([['patch', patchConnection]])
    })
}