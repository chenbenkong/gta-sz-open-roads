globalThis.__ASSET_BASE__="/gta-sz-open-roads/";
import{a as n}from"./chunk-HTIJ5P5S.js";var i="gaussianSplattingFragmentDeclaration",r=`fn gaussianColor(inColor: vec4f,inPosition: vec2f)->vec4f
{var A : f32=-dot(inPosition,inPosition);if (A>-4.0)
{var B: f32=exp(A)*inColor.a;
#include<logDepthFragment>
var color: vec3f=inColor.rgb;
#ifdef FOG
#include<fogFragment>
#endif
return vec4f(color,B);} else {return vec4f(0.0);}}
`;n.IncludesShadersStoreWGSL[i]||(n.IncludesShadersStoreWGSL[i]=r);var e="gaussianSplattingPixelShader",o=`#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>
varying vColor: vec4f;varying vPosition: vec2f;
#define CUSTOM_FRAGMENT_DEFINITIONS
#include<gaussianSplattingFragmentDeclaration>
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
var finalColor: vec4f=gaussianColor(input.vColor,input.vPosition);
#define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR
fragmentOutputs.color=finalColor;
#define CUSTOM_FRAGMENT_MAIN_END
}
`;n.ShadersStoreWGSL[e]||(n.ShadersStoreWGSL[e]=o);var m={name:e,shader:o};export{m as a};
