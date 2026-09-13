globalThis.__ASSET_BASE__="/gta-sz-open-roads/";
import"./chunk-PTBKYKNY.js";import"./chunk-4TCDTKA5.js";import"./chunk-IXQKQTGB.js";import"./chunk-KOSQWX5Z.js";import{a as e}from"./chunk-HTIJ5P5S.js";import"./chunk-RZKNP5ZY.js";var o="volumetricLightingRenderVolumeVertexShader",r=`#include<__decl__sceneVertex>
#include<__decl__meshVertex>
attribute vec3 position;varying vec4 vWorldPos;void main(void) {vec4 worldPos=world*vec4(position,1.0);vWorldPos=worldPos;gl_Position=viewProjection*worldPos;}
`;e.ShadersStore[o]||(e.ShadersStore[o]=r);var c={name:o,shader:r};export{c as volumetricLightingRenderVolumeVertexShader};
