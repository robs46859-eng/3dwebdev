import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface GeneratedSite {
  title: string;
  html: string;
  css: string;
  js: string;
  images: string[];
}

export async function generateSiteCode(prompt: string): Promise<GeneratedSite> {
  // 1. Generate the structure and content using Gemini Pro
  const codeResponse = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        role: "user",
        parts: [{ text: `Synthesize a COMPLETE, high-end 3D landing page website based on: "${prompt}". 
        
        CRITICAL: This is a FULL WEBSITE, not just a component. It must have a cohesive narrative flow across multiple sections.

        WEBSITE ARCHITECTURE:
        1. HERO SECTION: High-impact title, immersive 3D background, and a clear call to action.
        2. WORK/PORTFOLIO SECTION: Showcase projects or features using unique layouts (not standard grids).
        3. ABOUT/STORY SECTION: Narrative text with sophisticated typography and integrated 3D elements.
        4. CONTACT/FOOTER: A minimal but striking conclusion to the experience.

        CONTENT STRATEGY:
        - Every section must have a clear heading and concise, high-impact body text.
        - Product/feature descriptions MUST be brief and punchy (max 2-3 sentences).
        - Use high-end, professional copy that matches the studio aesthetic.
        - Ensure all sections are connected by a consistent visual theme.

        CORE PHILOSOPHY:
        - TEXT RENDERING PRECISION: All text elements MUST use -webkit-font-smoothing: antialiased, -moz-osx-font-smoothing: grayscale, and text-rendering: optimizeLegibility to ensure maximum crispness across all devices and resolutions.
        - ADAPTIVE AESTHETIC: Analyze the user's prompt to determine the visual style. 
          - TECH/SLEEK (Keywords: 'tech', 'sleek', 'minimal', 'professional'): Use a dark palette (#000, #111), sharp corners, monospace accents (JetBrains Mono), and precise geometric 3D elements (cubes, grids).
          - PLAYFUL/MUSEUM (Keywords: 'playful', 'animated', 'fun', 'vibrant', 'museum', 'science'): Use a high-energy, vibrant palette (primary colors or bright neons), large rounded corners (border-radius: 3rem), bubbly typography (Outfit, Quicksand, or Bungee), and organic, bouncy 3D movements (spheres, blobs, interactive physics).
          - LUXURY/EDITORIAL (Keywords: 'luxury', 'editorial', 'premium', 'sophisticated'): Use a warm off-white or deep charcoal palette, serif typography (Playfair Display or Cormorant Garamond), elegant layouts with generous whitespace, and slow, graceful 3D elements (flowing silk, abstract gold ribbons).
        - 3D IS THE INTERFACE: Use Three.js to create a living, breathing background that spans the entire page.
        - DYNAMIC CAMERA & OBJECTS: The camera MUST move along a cinematic path (position and rotation) as the user scrolls. 3D objects should also transform (rotate, scale, or move) in sync with scroll progress to create a deeply interactive experience.
        - TYPOGRAPHY AS ARCHITECTURE: Use prompt-appropriate fonts from Google Fonts. For tech, use extreme weights (900 or 100). For playful, use bold, rounded weights. For luxury, use light, elegant serif weights.
        - CINEMATIC MOTION: Use GSAP for all transitions and scroll-triggered animations. Tech styles should be smooth and linear; playful styles should have elastic or bouncy eases; luxury styles should have slow, high-inertia eases.
        - PARALLAX DEPTH: Background elements (3D or 2D) should respond to scroll position to create a sense of depth across the entire website.

        TECHNICAL REQUIREMENTS:
        - Use Three.js (available as 'THREE' globally).
        - Use GSAP (available as 'gsap' globally).
        - Use Tailwind CSS for layout and typography.
        - The HTML MUST include a <canvas id="bg-canvas"></canvas> for the Three.js scene.
        - ASSET OPTIMIZATION: Use a THREE.LoadingManager to track texture loading. Implement a visual loading overlay in the HTML that disappears only when all assets are ready. Handle potential texture loading errors gracefully.
        - LAZY LOADING: For textures in non-hero sections ({{IMAGE_1}}, {{IMAGE_2}}), implement a lazy-loading strategy. Do not initialize these textures or their associated 3D objects until the user scrolls near those sections to improve initial load time.
        - Use {{IMAGE_0}} for the Hero background, {{IMAGE_1}} for the first Work item, and {{IMAGE_2}} for the second Work item.
        - Ensure the 3D scene handles window resizing and covers the full viewport.
        - The JS MUST implement a scroll listener that maps scroll progress to Three.js camera coordinates and object properties.
        - Use BufferGeometry and optimized materials (like MeshStandardMaterial with low roughness) to maintain high performance and visual fidelity.
        - Ensure the Three.js renderer is initialized with antialias: true and alpha: true.

        Return the response in JSON format:
        {
          "title": "Project Name",
          "html": "Complete HTML structure for a full-page website (INNER BODY CONTENT ONLY, NO <body> TAGS). Include multiple <section> elements with distinct IDs. Ensure all sections have transparent backgrounds to show the 3D canvas.",
          "css": "Tailwind-compatible custom CSS. DO NOT include body or section base styles (they are already provided). Focus on typography, layout, and section-specific styling.",
          "js": "The complete Three.js and GSAP logic. MUST include a window resize listener and a sophisticated scroll-based animation system. The camera MUST follow a cinematic path (position and rotation) mapped to the page's scroll progress. 3D objects should also transform (rotate, scale, or move) in sync with scroll to create a deeply interactive experience across all sections. ENSURE THE CODE IS COMPLETE AND NOT TRUNCATED. NEVER redefine global properties like 'fetch', 'alert', 'window', 'location', or 'document'. NEVER use these names as variable names. ALWAYS declare all variables with 'const' or 'let'. Keep the code concise and avoid excessive comments to prevent JSON truncation.",
          "imagePrompts": [
            "A detailed prompt for a high-end 3D texture or environment map for the Hero section.",
            "A prompt for a high-end abstract 3D asset for the first work item.",
            "A prompt for a high-end abstract 3D asset for the second work item."
          ]
        }` }]
      }
    ],
    config: {
      systemInstruction: "You are a world-class creative developer and 3D artist. Your goal is to synthesize high-end, immersive digital experiences across a wide spectrum of aesthetics—from sleek, minimalist tech portfolios to vibrant, playful animated sites. You value technical precision, prompt-appropriate typography, and cinematic motion. You never use templates. Always ensure the JSON is valid and the code is complete. Avoid using backticks (`) inside the JSON strings if possible, or escape them properly.",
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          html: { type: Type.STRING },
          css: { type: Type.STRING },
          js: { type: Type.STRING },
          imagePrompts: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["title", "html", "css", "js", "imagePrompts"]
      }
    }
  });

  const text = codeResponse.text;
  if (!text) throw new Error("Empty response from Gemini");
  
  let siteData;
  try {
    // Strip markdown code blocks if present
    const cleanJson = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    siteData = JSON.parse(cleanJson);
  } catch (e) {
    console.error("Failed to parse Gemini response:", text);
    throw new Error("The AI generated an invalid response format. Please try again.");
  }
  
  // 2. Generate images using Nano Banana (Gemini 2.5 Flash Image)
  const imageUrls: string[] = [];
  const prompts = siteData.imagePrompts || [];
  if (prompts.length > 0) {
    // Only take up to 3 prompts to avoid excessive API calls
    for (const imgPrompt of prompts.slice(0, 3)) {
      try {
        const imageResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: [{ parts: [{ text: imgPrompt }] }],
          config: {
            imageConfig: {
              aspectRatio: "16:9"
            }
          }
        });

        const candidates = imageResponse.candidates || [];
        for (const candidate of candidates) {
          const parts = candidate.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.data) {
              imageUrls.push(`data:image/png;base64,${part.inlineData.data}`);
            }
          }
        }
      } catch (e) {
        console.error("Image generation failed for prompt:", imgPrompt, e);
      }
    }
  }

  // 3. Inject images into HTML, CSS, and JS
  let finalHtml = siteData.html;
  let finalCss = siteData.css;
  let finalJs = siteData.js;

  imageUrls.forEach((url, index) => {
    const placeholder = `{{IMAGE_${index}}}`;
    finalHtml = finalHtml.replaceAll(placeholder, url);
    finalCss = finalCss.replaceAll(placeholder, url);
    finalJs = finalJs.replaceAll(placeholder, url);
  });

  return {
    title: siteData.title,
    html: finalHtml,
    css: finalCss,
    js: finalJs,
    images: imageUrls
  };
}
