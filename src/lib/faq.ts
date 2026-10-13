/** Aggregated FAQ content for /faq and discovery. Keep in sync with tool pages. */

export type FaqItem = { question: string; answer: string };

export type ToolFaqGroup = {
	path: string;
	name: string;
	items: FaqItem[];
};

export const toolFaqGroups: ToolFaqGroup[] = [
	{
		path: "/tools/advertising-metrics",
		name: "Advertising metrics calculator",
		items: [
			{
				question: "Is ROAS the same as profit?",
				answer: "No. ROAS only divides attributed revenue by ad spend. It ignores product cost, salaries, fees, and other expenses \u2014 so it is not profit and not overall ROI.",
			},
			{
				question: "What happens when spend is zero?",
				answer: "ROAS cannot be calculated (division by zero). Other metrics that still have a valid denominator are shown normally.",
			},
			{
				question: "What currency should I use?",
				answer: "Any single currency \u2014 keep spend and revenue in the same unit. The tool does not convert currencies.",
			},
		],
	},
	{
		path: "/tools/ai-system-risk-checklist",
		name: "AI system risk checklist",
		items: [
			{
				question: "Is this an official certification?",
				answer: "No. Completing the checklist does not certify your system and is not an official audit.",
			},
			{
				question: "Where are my answers stored?",
				answer: "Only if you click Save draft locally \u2014 then in this browser\u2019s localStorage on your device. The report download is a file you save. We do not upload your answers.",
			},
			{
				question: "Does a high score mean the system is safe?",
				answer: "No. Scores only describe how many checklist questions you answered and how many Yes vs No you chose.",
			},
		],
	},
	{
		path: "/tools/freelancer-rate",
		name: "Freelancer rate calculator",
		items: [
			{
				question: "What does margin % mean here?",
				answer: "It is a reserve: you divide (income + expenses) by (1 \u2212 margin) so billings include a buffer. It is not a tax rate.",
			},
			{
				question: "Why is my daily rate so high?",
				answer: "Daily rate multiplies hourly by hours per day (hours/week \u00f7 days/week). Fewer billable days or hours raise the rate needed to hit the same income.",
			},
			{
				question: "Is this a tax calculator?",
				answer: "No. Enter after-tax goals only if that is how you plan \u2014 the tool does not compute tax.",
			},
		],
	},
	{
		path: "/tools/image-compressor",
		name: "Image compressor",
		items: [
			{
				question: "Will every image hit my max KB?",
				answer: "No. The UI states that up front. When the limit is unmet after quality and scale attempts, you see an explicit \u201cnot met\u201d status \u2014 not a false success.",
			},
			{
				question: "Is my image uploaded?",
				answer: "No. Encoding uses Canvas in your browser. See Privacy.",
			},
			{
				question: "JPEG or WebP?",
				answer: "WebP often reaches a smaller size at similar quality. Use JPEG when a form only accepts .jpg.",
			},
		],
	},
	{
		path: "/tools/image-resizer",
		name: "Image resizer",
		items: [
			{
				question: "Is my image uploaded to a server?",
				answer: "No. The file stays in your browser for this tool. Clearing the page or using Clear revokes the temporary object URL.",
			},
			{
				question: "Why doesn\u2019t the file size match a KB limit?",
				answer: "This page resizes dimensions. For quality / optional max KB, use the image compressor.",
			},
			{
				question: "Does aspect lock change both fields?",
				answer: "Yes. Changing width recalculates height from the original ratio (and the reverse when you edit height).",
			},
		],
	},
	{
		path: "/tools/merge-pdf",
		name: "PDF merger",
		items: [
			{
				question: "Is my PDF uploaded to a server?",
				answer: "No. This tool reads and merges files with pdf-lib in your browser only. We do not upload the files.",
			},
			{
				question: "What order are pages merged in?",
				answer: "Top to bottom in the list. Use Up/Down to change order before merging.",
			},
			{
				question: "Why did an encrypted PDF fail?",
				answer: "pdf-lib cannot decrypt password-protected files in this tool. Remove the password in another app, then try again.",
			},
			{
				question: "Troubleshooting: file too large or merge failed",
				answer: "Check the soft limits (25 MB each, 20 files, 80 MB total). Shrink or split oversized PDFs elsewhere, merge fewer files at a time, and retry on a desktop if a phone runs out of memory. A clear error means the file was rejected; a blank crash usually means the browser hit a memory limit \u2014 use smaller inputs.",
			},
			{
				question: "Troubleshooting: \u201ccould not read\u201d / damaged PDF",
				answer: "Re-export or re-save the PDF from the original app, confirm it opens in a normal reader, then try again. Truncated downloads and renamed non-PDF files often trigger this error.",
			},
		],
	},
	{
		path: "/tools/nist-ai-rmf-checklist",
		name: "NIST AI RMF\u2013aligned checklist",
		items: [
			{
				question: "Is this an official NIST assessment?",
				answer: "No. It is an informal self-assessment aligned to published AI RMF 1.0 language.",
			},
			{
				question: "Where are answers stored?",
				answer: "Optional localStorage draft on this device, or a downloaded report file. Nothing is uploaded.",
			},
		],
	},
	{
		path: "/tools/owasp-llm-top10-checklist",
		name: "OWASP LLM Top 10 checklist",
		items: [
			{
				question: "Will this find every vulnerability?",
				answer: "No. It only records whether you believe certain defensive controls exist.",
			},
			{
				question: "Does it teach attacks?",
				answer: "No. Prompts ask about controls to review, not how to exploit systems.",
			},
		],
	},
	{
		path: "/tools/signature-formatter",
		name: "Signature formatter",
		items: [
			{
				question: "Why are there no application presets?",
				answer: "Presets require a public source URL and a verification date. Unverified exam or form sizes are not published. Enter requirements from the official instructions.",
			},
			{
				question: "Is the image uploaded?",
				answer: "No. Crop and encode run in your browser. See Privacy.",
			},
			{
				question: "Does this work on mobile?",
				answer: "Yes. Drag the crop box and use the corner handles (touch-friendly), then download the result. Large files may need more memory.",
			},
		],
	},
	{
		path: "/tools/split-pdf",
		name: "PDF splitter",
		items: [
			{
				question: "Is page 1 the first page?",
				answer: "Yes. Enter ranges the way you see them in a normal PDF reader (1 = first page).",
			},
			{
				question: "Is my PDF uploaded to a server?",
				answer: "No. This tool reads and splits files with pdf-lib in your browser only.",
			},
			{
				question: "Can I download each page as its own file?",
				answer: "Not in this version. Enter one set of ranges to build a single extracted PDF. For separate files, run the tool once per range.",
			},
			{
				question: "Troubleshooting: file too large or extract failed",
				answer: "Confirm the PDF is under 25 MB. If it is and the tab still crashes, the browser likely ran out of memory \u2014 use a desktop, a smaller source file, or a shorter page range. Clear errors (type, size, encrypted, damaged) mean the tool rejected the input on purpose.",
			},
			{
				question: "Troubleshooting: \u201cout of range\u201d page numbers",
				answer: "The tool shows how many pages the loaded PDF has (numbered 1 through N). Any page or range above N is rejected. Re-check the page count in a reader if you expected more pages.",
			},
		],
	},
	{
		path: "/tools/work-hours",
		name: "Work hours calculator",
		items: [
			{
				question: "Where is the weekly timesheet?",
				answer: "Use the Week tab on this same calculator \u2014 a dedicated duplicate page is not published, to avoid thin SEO copies.",
			},
			{
				question: "Does CSV match the screen?",
				answer: "Yes. Export uses the same net, break, and optional overtime totals shown in the result panel.",
			},
			{
				question: "Is data uploaded?",
				answer: "No. Times stay in your browser. CSV downloads from a local file blob.",
			},
		],
	},
];
