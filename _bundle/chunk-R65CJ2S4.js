globalThis.__ASSET_BASE__="/gta-sz-open-roads/";
import{a as o}from"./chunk-HTIJ5P5S.js";var r="oitBackBlendPixelShader",e=`precision highp float;uniform sampler2D uBackColor;void main() {glFragColor=texelFetch(uBackColor,ivec2(gl_FragCoord.xy),0);if (glFragColor.a==0.0) { 
discard;}}`;o.ShadersStore[r]||(o.ShadersStore[r]=e);var i={name:r,shader:e};export{i as a};
