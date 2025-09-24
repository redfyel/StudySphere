/**
 * Gathers all CSS styles from the document's stylesheets.
 * (No changes to this helper function)
 * @returns {string} A string containing all CSS rules.
 */
const getAllCssStyles = () => {
  let css = "";
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules || sheet.rules) {
        css += rule.cssText;
      }
    } catch (e) {
      console.warn("Could not read CSS rules from stylesheet:", e);
    }
  }
  return css;
};

/**
 * Saves the provided SVG element as a PNG image, capturing the entire mind map
 * content and correctly embedding CSS styles.
 * @param {SVGSVGElement} svgEl - The SVG element to save.
 * @param {string} fileName - The desired name of the downloaded file.
 */
export const saveSvgAsPng = (svgEl, fileName) => {
  if (!svgEl) {
    console.error("SVG element not found for saving.");
    return;
  }

  // --- THIS IS THE FIX ---
  // 1. Find the main group element that contains the whole mind map.
  const contentGroup = svgEl.querySelector("g");
  if (!contentGroup) {
    console.error("Mind map content group not found.");
    return;
  }

  // 2. Calculate the bounding box of the mind map content.
  // This gives us the true dimensions of the entire mind map.
  const bbox = contentGroup.getBBox();
  const padding = 20; // Add some padding around the map
  const viewboxX = bbox.x - padding;
  const viewboxY = bbox.y - padding;
  const viewboxWidth = bbox.width + padding * 2;
  const viewboxHeight = bbox.height + padding * 2;
  // --- END OF FIX ---

  // 3. Clone the original SVG to avoid modifying the live element.
  const svgClone = svgEl.cloneNode(true);

  // 4. Set the attributes on the clone to encompass the entire content.
  svgClone.setAttribute("width", viewboxWidth);
  svgClone.setAttribute("height", viewboxHeight);
  svgClone.setAttribute("viewBox", `${viewboxX} ${viewboxY} ${viewboxWidth} ${viewboxHeight}`);

  // 5. Create a <style> element to embed all necessary CSS.
  const style = document.createElement("style");
  style.textContent = getAllCssStyles(); // Get all document styles
  svgClone.insertBefore(style, svgClone.firstChild); // Add styles to the clone

  // 6. Serialize the styled SVG clone to a string.
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgClone);

  // 7. Create a data URL from the SVG string.
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();

  img.onload = () => {
    // 8. Create a canvas with the exact dimensions of the mind map content.
    const canvas = document.createElement("canvas");
    canvas.width = viewboxWidth;
    canvas.height = viewboxHeight;
    const ctx = canvas.getContext("2d");

    // Optional: Fill the background if you want to avoid a transparent background
    // ctx.fillStyle = '#1a202c'; // Example: dark background
    // ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 9. Draw the image from our SVG onto the canvas.
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    // 10. Trigger the download.
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  img.onerror = (err) => {
    console.error("Failed to load SVG image for saving.", err);
    URL.revokeObjectURL(url);
  };

  img.src = url;
};