const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const extractBtn = document.getElementById("extractBtn");
const results = document.getElementById("results");
const rawText = document.getElementById("rawText");
const apiKeyInput = document.getElementById("apiKey");
const apiUrlInput = document.getElementById("apiUrl");
const modelInput = document.getElementById("model");

let selectedFile = null;
let selectedImageUrl = null;

const fieldDefinitions = [
  {
    label: "Invoice Number",
    patterns: [
      /invoice\s*(?:no\.?|number)?\s*[:#-]?\s*([A-Za-z0-9-]+)/i,
      /(?:invoice|receipt)\s*#\s*([A-Za-z0-9-]+)/i,
    ],
  },
  {
    label: "Date",
    patterns: [
      /(?:date|issued)\s*[:#-]?\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}[\/.-][0-9]{1,2}[\/.-][0-9]{2,4})/i,
    ],
  },
  {
    label: "Amount",
    patterns: [
      /(?:total|amount|balance)\s*[:$#-]?\s*([$€£]?\s*[0-9,]+(?:\.\d{1,2})?)/i,
    ],
  },
  {
    label: "Customer Name",
    patterns: [
      /customer\s*name\s*[:#-]?\s*([A-Za-z .'-]+)/i,
      /name\s*[:#-]?\s*([A-Za-z .'-]+)/i,
    ],
  },
  {
    label: "Address",
    patterns: [
      /address\s*[:#-]?\s*([A-Za-z0-9, .'-]+)/i,
      /street\s*[:#-]?\s*([A-Za-z0-9, .'-]+)/i,
    ],
  },
  {
    label: "ZIP Code",
    patterns: [
      /zip(?:code)?\s*[:#-]?\s*([A-Za-z0-9-]+)/i,
      /postal(?:\s*code)?\s*[:#-]?\s*([A-Za-z0-9-]+)/i,
    ],
  },
  {
    label: "Tracking Number",
    patterns: [
      /tracking\s*(?:no\.?|number)?\s*[:#-]?\s*([A-Za-z0-9\s-]+)/i,
      /tracking\s*#\s*([A-Za-z0-9\s-]+)/i,
      /(?:shipment|package|parcel)\s*(?:id|no\.?|number)?\s*[:#-]?\s*([A-Za-z0-9\s-]+)/i,
      /usps\s*tracking\s*[:#-]?\s*([A-Za-z0-9\s-]+)/i,
    ],
  },
];

function renderResults(values) {
  results.innerHTML = "";

  if (!values.length) {
    results.innerHTML = "<p>No fields were recognized.</p>";
    return;
  }

  const payload = values.reduce((acc, item) => {
    acc[item.label] = item.value || "Not found";
    return acc;
  }, {});

  const jsonOutput = document.createElement("pre");
  jsonOutput.textContent = JSON.stringify(payload, null, 2);
  results.appendChild(jsonOutput);

  values.forEach((item) => {
    const row = document.createElement("div");
    row.className = "result-item";
    const confidence = typeof item.confidence === "number" ? `${Math.round(item.confidence * 100)}%` : "n/a";
    row.innerHTML = `<strong>${item.label}</strong><span>${item.value || "Not found"}</span><div>Confidence: ${confidence}</div>`;
    results.appendChild(row);
  });
}

function extractFieldsWithRegex(text) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const lines = normalized
    .split(/(?<=[.!?])\s+|\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return fieldDefinitions.map((field) => {
    const fullTextMatch = field.patterns.find((pattern) => pattern.test(normalized));
    const lineMatch = lines.find((line) => field.patterns.some((pattern) => pattern.test(line)));
    const selectedText = lineMatch || normalized;

    const matchedPattern = lineMatch
      ? field.patterns.find((pattern) => pattern.test(lineMatch))
      : fullTextMatch;

    if (!matchedPattern) {
      return { label: field.label, value: "Not found", confidence: 0.4, method: "regex" };
    }

    const match = selectedText.match(matchedPattern);
    const value = match?.[1] ? match[1].trim() : "Not found";
    return { label: field.label, value, confidence: 0.7, method: "regex" };
  });
}

function extractJsonPayload(content) {
  const cleaned = content.trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function extractFieldsWithAI(text, apiKey, apiUrl, model) {
  const prompt = `You are extracting structured fields from OCR text. Return JSON only as an array of objects with the shape {"label":"Invoice Number","value":"INV-100","confidence":0.95}. Use these labels exactly: Invoice Number, Date, Amount, Customer Name, Address, ZIP Code, Tracking Number. If a field is missing, set value to null and confidence to 0. OCR text:\n\n${text}`;

  const headers = {
    "Content-Type": "application/json",
  };

  if (apiUrl.includes("azure.com")) {
    headers["api-key"] = apiKey;
  } else {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "You extract structured data from OCR text and return strict JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI request failed with status ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  const parsed = extractJsonPayload(content);

  if (!Array.isArray(parsed)) {
    throw new Error("The AI response was not valid JSON.");
  }

  const normalizedResults = parsed.map((item) => ({
    label: item.label || "Field",
    value: item.value || "Not found",
    confidence: typeof item.confidence === "number" ? item.confidence : 0.5,
    method: "ai",
  }));

  return normalizedResults;
}

imageInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  selectedFile = file;
  if (selectedImageUrl) {
    URL.revokeObjectURL(selectedImageUrl);
  }
  selectedImageUrl = URL.createObjectURL(file);
  preview.src = selectedImageUrl;
  preview.style.display = "block";
  extractBtn.disabled = false;
  results.innerHTML = "";
  rawText.textContent = "Waiting for OCR...";
});

extractBtn.addEventListener("click", async () => {
  if (!selectedFile) {
    alert("Please choose an image first.");
    return;
  }

  extractBtn.disabled = true;
  rawText.textContent = "Running OCR...";
  results.innerHTML = "<p>Processing image…</p>";

  try {
    const imageSource = selectedImageUrl || (selectedFile ? URL.createObjectURL(selectedFile) : null);

    if (!imageSource) {
      throw new Error("No image source is available.");
    }

    const { data } = await Tesseract.recognize(imageSource, "eng", {
      logger: (info) => {
        if (info.status === "recognizing text") {
          rawText.textContent = `OCR progress: ${Math.round(info.progress * 100)}%`;
        }
      },
    });

    const normalizedText = data.text.replace(/\s+/g, " ").trim();
    rawText.textContent = normalizedText || "No text detected.";

    const apiKey = apiKeyInput.value.trim();
    const apiUrl = apiUrlInput.value.trim() || "https://api.openai.com/v1/chat/completions";
    const model = modelInput.value.trim() || "gpt-4o-mini";

    let extractedFields;

    if (apiKey) {
      extractedFields = await extractFieldsWithAI(normalizedText, apiKey, apiUrl, model);
    } else {
      extractedFields = extractFieldsWithRegex(normalizedText);
    }

    renderResults(extractedFields);
  } catch (error) {
    rawText.textContent = `OCR failed: ${error.message}`;
    results.innerHTML = "<p>OCR could not be completed.</p>";
  } finally {
    extractBtn.disabled = false;
  }
});

extractBtn.disabled = true;
