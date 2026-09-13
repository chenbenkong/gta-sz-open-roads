globalThis.__ASSET_BASE__="/gta-sz-open-roads/";
import{a as e}from"./chunk-HTIJ5P5S.js";var r="lodPixelShader",o=`precision highp float;const float GammaEncodePowerApprox=1.0/2.2;varying vec2 vUV;uniform sampler2D textureSampler;uniform float lod;uniform vec2 texSize;uniform int gamma;void main(void)
{ivec2 textureDimensions=textureSize(textureSampler,0);gl_FragColor=texelFetch(textureSampler,ivec2(vUV*vec2(textureDimensions)),int(lod));if (gamma==0) {gl_FragColor.rgb=pow(gl_FragColor.rgb,vec3(GammaEncodePowerApprox));}}
`;e.ShadersStore[r]||(e.ShadersStore[r]=o);var a={name:r,shader:o};export{a};
