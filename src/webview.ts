import * as vscode from 'vscode';

const canvasScript = `
  const DATA_OK = 'Success';

  window.addEventListener('message', event => {
    console.log(event.data);
    const status = event.data.status;
    if (status !== DATA_OK) {
      const textNode = document.createTextNode(status);
      const errorTag = document.getElementById('errorTag');
      errorTag.appendChild(textNode);
    }
    else {
      const { width, height, imageData } = event.data;
      const canvas = document.querySelector("#canvas");
      console.log(event.data);
      if (imageData && Object.keys(imageData).length === width * height * 3) {
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        const image = new ImageData(width, height);
        const pixels = image.data;
        
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            const offset = (y * width) + x;
            pixels[(offset * 4) + 0] = imageData[(offset * 3) + 0];
            pixels[(offset * 4) + 1] = imageData[(offset * 3) + 1];
            pixels[(offset * 4) + 2] = imageData[(offset * 3) + 2];
            pixels[(offset * 4) + 3] = 255; 
          } 
        }
        
        ctx.putImageData(image, 0, 0);
      } else {
        canvas.remove();
      }
    }
  });
`;

export const getHTMLforWebview = (webview: vscode.Webview, context: vscode.ExtensionContext): string => {  
  return /* html */`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>PPM Preview</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          #canvas {
            background-color: whitesmoke;
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
        </style>
      </head>
      <body>
        <p id="errorTag"></p>
        <div id="frame">
          <canvas id="canvas"></canvas>
        </div>
        <script>${canvasScript}</script>
      </body>
    </html>
  `;
};
