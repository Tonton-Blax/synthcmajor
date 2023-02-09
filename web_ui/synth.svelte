<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import Knob from 'svelte-knob'
	import { Slider } from "fluent-svelte";
	export let inputs;

	let shape = ['sine', 'triangle','saw', 'square', 'impulse'];

	const dispatch = createEventDispatcher();

	$: setupInputs (inputs)
	$: dispatch('sendValue', { endpoint : 'osc1FreqIn', val : osc1FreqIn });
	$: dispatch('sendValue', { endpoint : 'osc2FreqIn', val : osc2FreqIn });
	$: dispatch('sendValue', { endpoint : 'attack', val : attack });
	$: dispatch('sendValue', { endpoint : 'release', val : release });
	$: dispatch('sendValue', { endpoint : 'decay', val : decay });
	$: dispatch('sendValue', { endpoint : 'sustain', val : sustain });
	$: dispatch('sendValue', { endpoint : 'boolIn', val : gateOn })

	let osc1FreqIn;
	let osc2FreqIn;
	let attack;
	let decay;
	let release;
	let sustain;
	const osc1 = {};
	const osc2 = {};
	const adsr1 = {}
	let gateOn = false;

	const setupInputs = (inputs) => {

		if (!Array.isArray(inputs))
			return;

		console.log(inputs)

		osc1.freq = inputs.find(i => i.endpointID === 'osc1FreqIn');
		osc1FreqIn = osc1.freq.annotation.init;

		osc2.freq = inputs.find(i => i.endpointID === 'osc2FreqIn');
		osc2FreqIn = osc2.freq.annotation.init;

		adsr1.attack = inputs.find(i => i.endpointID === 'attack');
		attack = adsr1.attack.annotation.init;

		adsr1.decay = inputs.find(i => i.endpointID === 'decay');
		attack = adsr1.decay.annotation.init;

		adsr1.sustain = inputs.find(i => i.endpointID === 'sustain');
		attack = adsr1.sustain.annotation.init;

		adsr1.release = inputs.find(i => i.endpointID === 'release');
		release = adsr1.release.annotation.init;
	}

</script>

<div class="container">
	<div class="modMatrix">
		<div class="env1">d</div>
		<div class="env2"></div>
		<div class="_math"></div>
		<div class="_shape"></div>
		<div class="_invert"></div>
		<div class="_clip"></div>
		<div class="nw"></div>
		<div class="pb"></div>
		<div class="at"></div>
		<div class="math"></div>
		<div class="shape"></div>
		<div class="invert"></div>
		<div class="clip"></div>
		<div class="lfo1"></div>
		<div class="lfo2"></div>
			<div>
				
			</div>
			<div>
				
			</div>
			<div style="text-align:center;margin:auto;color:red;font-size:24px;">
				X
			</div>
			
	</div>
	<div class="adsr1">
			ENV1
			<div class="flexline" style="height:150px;">
				<div class="flexbox"><Slider orientation="vertical" 
					min={adsr1?.attack?.annotation?.min} 
					max={adsr1?.attack?.annotation?.max}
					step={adsr1?.sustain?.annotation?.step}
					bind:value={attack} 
				/>
					A
				</div>
				<div class="flexbox"><Slider orientation="vertical" 
					min={adsr1?.decay?.annotation?.min} 
					max={adsr1?.decay?.annotation?.max}
					step={adsr1?.sustain?.annotation?.step}
					bind:value={decay} />
					D
				</div>
				<div class="flexbox"><Slider orientation="vertical" min={adsr1?.sustain?.annotation?.min} 
					max={adsr1?.sustain?.annotation?.max}
					step={adsr1?.sustain?.annotation?.step}
					bind:value={sustain} />
					S
				</div>
				<div class="flexbox"><Slider orientation="vertical"
					min={adsr1?.release?.annotation?.min} 
					max={adsr1?.release?.annotation?.max}
					step={adsr1?.sustain?.annotation?.step}
					bind:value={release} />
					R
				</div>
				<div class="flexbox">
						<button class="pt" state="active">snap</button>
						<button class="pt" state="active">slow</button>
				</div>
			</div>
		</div>
	<div class="adsr2">
			ENV2
			<div class="flexline" style="height:150px;">
				<div class="flexbox"><Slider orientation="vertical" value={24} />A</div>
				<div class="flexbox"><Slider orientation="vertical" value={50} />D</div>
				<div class="flexbox"><Slider orientation="vertical" value={76} />S</div>
				<div class="flexbox"><Slider orientation="vertical" value={24} />R</div>
				<div class="flexbox">
						<button class="pt" state="active">snap</button>
						<button class="pt" state="active">slow</button>
				</div>
			</div>
		</div>
		
	<div class="osc1">
			OSC1
			<div class="flexline">
				<div class="flexbox">
					<Knob 
						bind:value={osc1FreqIn} 
						min={osc1?.freq?.annotation?.min} 
						max={osc1?.freq?.annotation?.max}
						step={10} strokeWidth={10} primaryColor="#E844C3" />
					<div>Tuning</div>
				</div>
				
				<div class="flexbox">
					<Knob value={0} min={0} max={4} step={1} strokeWidth={10} primaryColor="#E844C3"
								valueDisplayFunction={v=>shape[v]}></Knob>
					<div>Shape</div>
				</div>
				
				<div class="flexbox">
					<Knob value={12} min={-60} max={60} step={1} strokeWidth={10} primaryColor="#E844C3" />
					<div>Volume</div>
				</div>
			</div>
		</div>
	<div class="osc2">
			OSC2
			<div class="flexline">
				<div class="flexbox">
					<Knob 
						bind:value={osc2FreqIn} 
						min={osc2?.freq?.annotation?.min} 
						max={osc2?.freq?.annotation?.max}
						step={10} strokeWidth={10} primaryColor="#E844C3" />
					<div>Tuning</div>
					<button state="active">sync</button>
				</div>
				
				<div class="flexbox">
					<Knob value={0} min={0} max={4} step={1} strokeWidth={10} primaryColor="#E844C3"
								valueDisplayFunction={v=>shape[v]}></Knob>
					<div>Shape</div>
				</div>
				
				<div class="flexbox">
					<Knob value={12} min={-60} max={60} step={1} strokeWidth={10} primaryColor="#E844C3" />
					<div>Volume</div>
				</div>
			</div>
		
		</div>
	<div class="lfos">

	</div>
	<div class="sub">
			SUB
				<div class="flexline">
					<div class="flexbox">					
					<Knob value={12} min={-60} max={60} step={1} strokeWidth={10} primaryColor="#E844C3" />
					<div>Volume</div>
				</div>
				<div class="flexbox">
				<button class="pt">8vb</button>
				<button class="pt">square</button>
				</div>
			</div>
		</div>
	<div class="noise">

	</div>
	<div class="reverb">
	</div>
	<div class="delay"></div>
	<div class="voicing"></div>
	<div class="vcf"></div>
	<div class="hpf"></div>
	<div class="fine"></div>
	<div class="branding">
		<button class:red={gateOn} on:click={ e => gateOn = !gateOn }>GATE</button>
	</div>
	<div class="reserved1"></div>
	<div class="reserved2"></div>
</div>

<style>

	@import url("https://unpkg.com/fluent-svelte/theme.css");
	
	:global(:root) {
		--fds-control-strong-fill-default : gray;
	}

	.branding > button.red {
		background-color:tomato;
	}

	.branding > button {
		font-size:100px;
		background-color: transparent;
		padding:12px;
	}
	.branding {
		display:flex;
		justify-content: center;
		align-items: center;
	}
	
	.flexline {
		display:flex;
		justify-content: space-evenly;
	}
	.flexbox {
		display:flex;
		flex-direction:column;
		justify-content: flex-start;
		width:min-content;
		text-align:center;
	}
	.flexbox > * {
		width:auto;
		margin:5px auto;
	}

  .container > * {
    border: 1px solid gray;
  }

  .container {  display: grid;
    grid-template-columns: 200px 200px 200px 200px 200px 200px;
    grid-template-rows: 200px 200px 150px 150px 150px;
    gap: 0px 0px;
    grid-auto-flow: row;
    justify-content: center;
    align-content: center;
    justify-items: stretch;
    align-items: stretch;
    grid-template-areas:
      "osc1 osc1 branding branding adsr1 adsr1"
      "osc2 osc2 vcf vcf adsr2 adsr2"
      "sub noise hpf fine lfos voicing"
      "reserved1 modMatrix modMatrix modMatrix modMatrix reverb"
      "reserved2 modMatrix modMatrix modMatrix modMatrix delay";
  }

  .modMatrix {  display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr 1fr 1fr;
    gap: 0px 0px;
    grid-auto-flow: row;
    justify-content: center;
    justify-items: stretch;
    align-items: stretch;
    grid-template-areas:
      ". lfo1 lfo2 env1 env2 nw pb at math shape invert clip"
      "_math . . . . . . . . . . ."
      "_shape . . . . . . . . . . ."
      "_invert . . . . . . . . . . ."
      "_clip . . . . . . . . . . .";
    grid-area: modMatrix;
  }

	.modMatrix > * {
		border: 1px dashed gray;
	}

  .env1 { grid-area: env1; }

  .env2 { grid-area: env2; }

  ._math { grid-area: _math; }

  ._shape { grid-area: _shape; }

  ._invert { grid-area: _invert; }

  ._clip { grid-area: _clip; }

  .nw { grid-area: nw; }

  .pb { grid-area: pb; }

  .at { grid-area: at; }

  .math { grid-area: math; }

  .shape { grid-area: shape; }

  .invert { grid-area: invert; }

  .clip { grid-area: clip; }

  .lfo1 { grid-area: lfo1; }

  .lfo2 { grid-area: lfo2; }

  .adsr1 { grid-area: adsr1; }

  .adsr2 { grid-area: adsr2; }

  .osc1 { grid-area: osc1; }

  .osc2 { grid-area: osc2; }

  .lfos { grid-area: lfos; }

  .sub { grid-area: sub; }

  .noise { grid-area: noise; }

  .reverb { grid-area: reverb; }

  .delay { grid-area: delay; }

  .voicing { grid-area: voicing; }

  .vcf { grid-area: vcf; }

  .hpf { grid-area: hpf; }

  .fine { grid-area: fine; }

  .branding { grid-area: branding; }

  .reserved1 { grid-area: reserved1; }

  .reserved2 { grid-area: reserved2; }

	button {
		font-size:12px;
		padding:4px;
	}
	button:focus {
		background:tomato;
		color:white;
	}
	button.pt {
		height:24px;
	}

</style>