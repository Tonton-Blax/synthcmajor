<script>
  import Synth from "./synth.svelte";
  import { onMount } from "svelte";
  
  let inputBinding;
  export let patch;
  const frames = 16;
  let i = '_';
  let vh = 500;
  let vw = 500;
  let inputs;

  onMount(async()=>{

    patch.onPatchStatusChanged = (buildError, manifest, inputEndpoints, outputEndpoints)=> {
      const { view } = manifest;
      vh = view.height;
      vw = view.width;
      inputs = inputEndpoints;
    };

    /*
    patch.onParameterEndpointChanged = (...args)=>console.log('onParameterEndpointChanged' , args);
    patch.onSampleRateChanged = (...args)=>console.log('onSampleRateChanged' , args);
    patch.onParameterEndpointChanged = (...args)=>console.log('onParameterEndpointChanged' , args);
    patch.onOutputEvent = (...args)=>console.log('onOutputEvent' , args);
    */
    const manifest = patch.requestStatusUpdate();
  })

  function change() {
    inputBinding.value = "testing" + Math.round(Math.random() * 100);
  }

  function send({endpoint, val}) {
    if (!endpoint)
      return;
    patch.sendEventOrValue (endpoint, val, 16);
  }
  
</script>

<main style="
  --vh:{vh}px;
  --vw:{vw}px;
">

<Synth {inputs} on:sendValue={(e)=>send(e.detail)} />

</main>

<style>
  :global(body) {
    margin:1px;
    font-family: 'Sofia Sans Extra Condensed', sans-serif;
  }
  main {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    height: var(--vh);
    width: var(--vw);
    background-color: #ece7df;
    color: black;
  }
  

  label { display: flex }
	input, p { margin: 6px }

</style>
