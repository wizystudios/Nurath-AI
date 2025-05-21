
import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlayCircle, Download, Copy, Save, RotateCw, FileCode, FileText, FileJson } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const CodeEditor = () => {
  const [htmlCode, setHtmlCode] = useState(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Web Page</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>Welcome to Nurath.AI Code Editor</h1>
    <p>This is a paragraph of text. You can edit this code!</p>
    <button id="myButton">Click Me!</button>
  </div>
  
  <script src="script.js"></script>
</body>
</html>`);

  const [cssCode, setCssCode] = useState(`body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: white;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

h1 {
  color: #333;
}

button {
  background-color: #4CAF50;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}`);

  const [jsCode, setJsCode] = useState(`// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function() {
  // Get the button element
  const button = document.getElementById("myButton");
  
  // Add click event listener
  button.addEventListener("click", function() {
    alert("Button was clicked!");
  });
  
  // Log a message to console
  console.log("Script loaded successfully!");
});`);

  const [output, setOutput] = useState("");
  
  const handleRun = () => {
    const combinedOutput = `
      <html>
        <head>
          <style>${cssCode}</style>
        </head>
        <body>${htmlCode}</body>
        <script>${jsCode}</script>
      </html>
    `;
    setOutput(combinedOutput);
    toast.success("Code executed successfully!");
  };
  
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };
  
  const handleSave = () => {
    // In a real app, this would save to a database
    toast.success("Project saved successfully!");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Interactive Code Editor</h1>
            <p className="text-muted-foreground mt-2">
              Write, test and learn coding in real-time
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <Button variant="outline" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button onClick={handleRun}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Run Code
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="lg:col-span-1">
            <CardContent className="p-0">
              <Tabs defaultValue="html" className="w-full">
                <TabsList className="w-full rounded-t-lg rounded-b-none">
                  <TabsTrigger value="html" className="flex gap-2 flex-1">
                    <FileCode className="h-4 w-4" />
                    HTML
                  </TabsTrigger>
                  <TabsTrigger value="css" className="flex gap-2 flex-1">
                    <FileText className="h-4 w-4" />
                    CSS
                  </TabsTrigger>
                  <TabsTrigger value="js" className="flex gap-2 flex-1">
                    <FileJson className="h-4 w-4" />
                    JavaScript
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="html" className="mt-0">
                  <div className="relative">
                    <textarea
                      value={htmlCode}
                      onChange={(e) => setHtmlCode(e.target.value)}
                      className="w-full h-[400px] font-mono p-4 text-sm bg-muted/50 focus:outline-none"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => handleCopy(htmlCode)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="css" className="mt-0">
                  <div className="relative">
                    <textarea
                      value={cssCode}
                      onChange={(e) => setCssCode(e.target.value)}
                      className="w-full h-[400px] font-mono p-4 text-sm bg-muted/50 focus:outline-none"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => handleCopy(cssCode)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="js" className="mt-0">
                  <div className="relative">
                    <textarea
                      value={jsCode}
                      onChange={(e) => setJsCode(e.target.value)}
                      className="w-full h-[400px] font-mono p-4 text-sm bg-muted/50 focus:outline-none"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => handleCopy(jsCode)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardContent className="p-0">
              <div className="bg-muted p-2 flex justify-between items-center">
                <span className="font-medium text-sm">Preview</span>
                <Button variant="ghost" size="sm">
                  <RotateCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              <div className="bg-white h-[400px] border-t">
                <iframe
                  title="Code Preview"
                  srcDoc={output || `
                    <html>
                      <head>
                        <style>${cssCode}</style>
                      </head>
                      <body>${htmlCode}</body>
                      <script>${jsCode}</script>
                    </html>
                  `}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  sandbox="allow-scripts"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <div className="bg-muted p-3 flex justify-between items-center">
            <span className="font-medium">Console Output</span>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Code
            </Button>
          </div>
          <CardContent className="bg-black text-green-400 font-mono p-4 h-24 overflow-auto text-sm">
            {`> Script loaded successfully!`}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CodeEditor;
