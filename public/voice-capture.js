// SPDX-License-Identifier: AGPL-3.0-only
// Browser audio thread: low-pass box resampling to 8 kHz mono PCM16. No recordings or output.
class AureaVoiceCapture extends AudioWorkletProcessor {
 constructor(){super();this.samples=new Int16Array(4096);this.used=0;this.phase=0;this.sum=0;this.count=0;this.done=false;this.frames=0;
  this.port.onmessage=event=>{if(event.data==='flush'){this.flush();this.done=true;this.port.postMessage({flushed:true});}};
 }
 flush(){if(this.used){const bytes=this.samples.buffer.slice(0,this.used*2);this.port.postMessage(bytes,[bytes]);this.samples.fill(0);this.used=0;}}
 process(inputs){if(this.done)return false;const input=inputs[0]?.[0];if(!input)return true;
  for(const sample of input){this.sum+=sample;this.count++;this.phase+=8000;if(this.phase>=sampleRate){this.phase-=sampleRate;const value=Math.max(-1,Math.min(1,this.sum/this.count));this.samples[this.used++]=Math.round(value*(value<0?32768:32767));this.sum=0;this.count=0;if(this.used===4096)this.flush();}}
  this.frames+=input.length;if(this.frames>=sampleRate*30){this.flush();this.done=true;this.port.postMessage({flushed:true});return false;}return true;
 }
}
registerProcessor('aurea-voice',AureaVoiceCapture);
