globalThis.__ASSET_BASE__="/gta-sz-open-roads/";
import{a as r}from"./chunk-HTIJ5P5S.js";var i="lightProxyPixelShader",o=`flat varying vec2 vLimits;flat varying highp uint vMask;void main(void) {if (gl_FragCoord.y<vLimits.x || gl_FragCoord.y>vLimits.y) {discard;}
gl_FragColor=vec4(vMask,0,0,1);}
`;r.ShadersStore[i]||(r.ShadersStore[i]=o);var t={name:i,shader:o};export{t as a};
