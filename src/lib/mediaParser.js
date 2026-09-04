import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import JSZip from 'jszip';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  }
}

/**
 * Converts a list of image files into slide objects.
 */
export async function parseImagesToSlides(files = []) {
  const fileArray = Array.isArray(files) ? files : [files];
  const slides = [];

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];
    if (!file || !file.type.startsWith('image/')) continue;

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    slides.push({
      id: `img-slide-${Date.now()}-${i + 1}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      body: '',
      reference: '',
      mediaPath: dataUrl,
      mediaType: 'image',
      aspectRatio: '16 / 9',
      backgroundColor: '#000000',
      textColor: '#ffffff',
      accent: '#e5b965',
      highlights: []
    });
  }

  return slides;
}

/**
 * Parses a PDF file and renders all pages to high-resolution JPEG Data URLs.
 */
export async function parsePdfToSlides(file, onProgress) {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const slides = [];
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (onProgress) {
      onProgress(pageNum, numPages);
    }

    const page = await pdfDoc.getPage(pageNum);
    // Render at 2x scale for ultra-crisp presentation rendering
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    await page.render({
      canvasContext: ctx,
      viewport
    }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.94);

    slides.push({
      id: `pdf-slide-${Date.now()}-${pageNum}`,
      title: `${baseName} (Page ${pageNum})`,
      body: '',
      reference: `Page ${pageNum} of ${numPages}`,
      mediaPath: dataUrl,
      mediaType: 'image',
      aspectRatio: viewport.width >= viewport.height ? '16 / 9' : '4 / 3',
      backgroundColor: '#000000',
      textColor: '#ffffff',
      accent: '#e5b965',
      highlights: []
    });
  }

  return slides;
}

/**
 * Parses a PPTX file using JSZip to extract slide text and embedded slide graphics.
 */
export async function parsePptxToSlides(file) {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  // Locate all slide XML entries and sort them in order
  const slideFileNames = Object.keys(zip.files).filter((path) =>
    /^ppt\/slides\/slide\d+\.xml$/i.test(path)
  );

  slideFileNames.sort((a, b) => {
    const numA = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
    const numB = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
    return numA - numB;
  });

  const slides = [];
  const parser = new DOMParser();

  for (let i = 0; i < slideFileNames.length; i++) {
    const slidePath = slideFileNames[i];
    const slideNum = i + 1;
    const xmlText = await zip.files[slidePath].async('text');
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

    // 1. Extract text lines from paragraphs
    const paragraphs = xmlDoc.getElementsByTagName('a:p');
    const textLines = [];

    for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
      const p = paragraphs[pIdx];
      const textNodes = p.getElementsByTagName('a:t');
      let line = '';
      for (let tIdx = 0; tIdx < textNodes.length; tIdx++) {
        line += textNodes[tIdx].textContent || '';
      }
      line = line.trim();
      if (line) {
        textLines.push(line);
      }
    }

    // 2. Check for relationship file to locate images in this slide
    let slideImage = null;
    const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
    if (zip.files[relsPath]) {
      try {
        const relsXml = await zip.files[relsPath].async('text');
        const relsDoc = parser.parseFromString(relsXml, 'application/xml');
        const relNodes = relsDoc.getElementsByTagName('Relationship');

        for (let rIdx = 0; rIdx < relNodes.length; rIdx++) {
          const type = relNodes[rIdx].getAttribute('Type') || '';
          const target = relNodes[rIdx].getAttribute('Target') || '';

          if (type.includes('/image') && target) {
            // Target is typically like "../media/image1.png"
            const mediaKey = target.replace(/^\.\.\//, 'ppt/');
            if (zip.files[mediaKey]) {
              const mimeType = mediaKey.endsWith('.png') ? 'image/png' : 'image/jpeg';
              const base64Data = await zip.files[mediaKey].async('base64');
              slideImage = `data:${mimeType};base64,${base64Data}`;
              break; // Use the primary slide image
            }
          }
        }
      } catch (e) {
        console.warn('Error reading slide relationships:', e);
      }
    }

    const slideBody = textLines.join('\n');

    slides.push({
      id: `pptx-slide-${Date.now()}-${slideNum}`,
      title: `${baseName} · Slide ${slideNum}`,
      body: slideBody,
      reference: textLines.length > 0 ? textLines[0] : '',
      mediaPath: slideImage || null,
      mediaType: slideImage ? 'image' : 'text',
      fontSize: 38,
      align: 'center',
      fontFamily: 'Noto Sans Tamil',
      backgroundColor: '#0c1322',
      textColor: '#ffffff',
      accent: '#e5b965',
      highlights: []
    });
  }

  // Fallback if no slides found
  if (slides.length === 0) {
    slides.push({
      id: `pptx-slide-${Date.now()}-1`,
      title: `${baseName} · Slide 1`,
      body: baseName,
      reference: '',
      fontSize: 38,
      align: 'center',
      fontFamily: 'Noto Sans Tamil',
      backgroundColor: '#0c1322',
      textColor: '#ffffff',
      accent: '#e5b965',
      highlights: []
    });
  }

  return slides;
}
