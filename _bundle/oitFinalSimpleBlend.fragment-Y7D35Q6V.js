globalThis.__ASSET_BASE__="/gta-sz-open-roads/";
import{a as o}from"./chunk-HTIJ5P5S.js";import"./chunk-RZKNP5ZY.js";var r="oitFinalSimpleBlendPixelShader",e=`precision highp float;uniform sampler2D uFrontColor;void main() {ivec2 fragCoord=ivec2(gl_FragCoord.xy);vec4 frontColor=texelFetch(uFrontColor,fragCoord,0);glFragColor=frontColor;}
`;o.ShadersStore[r]||(o.ShadersStore[r]=e);var l={name:r,shader:e};export{l as oitFinalSimpleBlendPixelShader};
