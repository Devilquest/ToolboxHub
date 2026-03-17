<div align="center">

# ToolboxHub

**An all-in-one, private-first collection of simple and powerful online utilities.**

![Version](https://img.shields.io/badge/version-1.0.3-blue.svg)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-10b981.svg)](https://devilquest.github.io/ToolboxHub/)
[![License: MIT](https://img.shields.io/badge/License-MIT-f59e0b.svg)](LICENSE)

🌐 **[Try it live → devilquest.github.io/ToolboxHub](https://devilquest.github.io/ToolboxHub/)**

</div>

---

## 📑 Table of Contents

### 📖 General Information
- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Included Tools](#included-tools)
- [How it Works](#how-it-works)
  - [Customizable Dashboard](#customizable-dashboard)
  - [Rule of Three Calculator](#rule-of-three-calculator)
  - [Aspect Ratio Calculator](#aspect-ratio-calculator)
  - [Tax Calculator](#tax-calculator)
  - [File Metadata Viewer](#file-metadata-viewer)
  - [Web Color Viewer](#web-color-viewer)
  - [CSS Compare](#css-compare)
  - [HTML Extractor](#html-extractor)
  - [HTML Merger](#html-merger)
  - [Style Stripper](#style-stripper)
- [Motivation](#motivation)

### 💻 Technical Deep Dive
- [Getting Started](#getting-started)
- [Architecture & Technologies](#architecture-technologies)
  - [Core Architecture](#core-architecture)
  - [Component & Utility Model](#component-utility-model)
  - [Data Persistence & State](#data-persistence-state)
  - [CSS System](#css-system)
  - [Project Structure](#project-structure)
- [Usage & Examples](#usage-examples)
- [Detailed Tool Logic](#detailed-tool-logic)
  - [Customizable Dashboard](#customizable-dashboard-logic)
  - [Rule of Three Calculator](#rule-of-three-calculator-logic)
  - [Aspect Ratio Calculator](#aspect-ratio-calculator-logic)
  - [Tax Calculator](#tax-calculator-logic)
  - [File Metadata Viewer](#file-metadata-viewer-logic)
  - [Web Color Viewer](#web-color-viewer-logic)
  - [CSS Compare](#css-compare-logic)
  - [HTML Extractor](#html-extractor-logic)
  - [HTML Merger](#html-merger-logic)
  - [Style Stripper](#style-stripper-logic)
- [Shared Technical Core](#shared-technical-core)
- [Credits & Contact](#credits-contact)
- [Changelog](#changelog)
- [License](#license)

---

## 👋 About the Project <a id="about-the-project"></a>

**ToolboxHub** is a unified workspace designed to consolidate multiple specialized web utilities into a single, high-performance ecosystem. 

Before this project, each tool existed on its own domain and server, making maintenance a logistical nightmare. A simple design update required individual changes across nearly ten different codebases. By centralizing these tools, we've eliminated code duplication, unified the visual identity, and created a seamless user experience where switching between a Tax Calculator and a CSS Diff tool is just a sidebar click away.

---

## ✨ Key Features <a id="key-features"></a>

- 🛠️ **Unified Toolset**: Nine essential utilities (Metadata, Calculators, Dev Tools) in one place.
- 🔒 **Privacy First**: Your data never leaves your device.
    - **Client-Side Only**: 100% of the logic runs in your browser. No data, files, or snippets are ever uploaded to a server.
    - **No Analytics**: No Google Analytics, no trackers, no cookies. Your usage remains completely anonymous.
    - **Offline Execution**: Once loaded, every single tool works without an active internet connection.
    - **Transparent Data**: You can view, manage, or wipe all locally stored tool settings from the Global Settings modal at any time.

- 🎨 **Shared Design System**: A cohesive, premium dark-mode interface powered by a centralized CSS framework.
- ⚡ **Zero Dependencies**: Built with pure Vanilla JS and CSS for maximum speed and zero bloat.
- 📱 **Fully Responsive**: Optimized for everything from ultrawide monitors to mobile devices.
- 💾 **Persistent Settings**: LocalStorage integration to remember your preferences and data across sessions.

---

## 🛠️ Included Tools <a id="included-tools"></a>

- **Rule of Three Calculator**: Solve proportions and direct rules of three.
- **Aspect Ratio Calculator**: Calculate and convert aspect ratios for images and videos.
- **Tax Calculator**: Calculate capital gains and income taxes with flat or progressive bracket rates. Supports forward and reverse calculations.
- **File Metadata Viewer**: View hidden data and metadata from any file, including images (EXIF), audio (ID3), videos, and documents.
- **Web Color Viewer**: Compare and visualize web colors with presets, sorting, and drag-and-drop reordering.
- **CSS Compare**: Compare two CSS stylesheets to find shared rules, differences, and unique properties.
- **HTML Extractor**: Extract all inline style and script blocks from an HTML file and create linked external files.
- **HTML Merger**: Combine an HTML file with multiple CSS and JS files into a single, standalone HTML document.
- **Style Stripper**: Clean HTML and JS by stripping CSS classes, inline styles, and styling logic to get pure, unstyled code.

---

## 🕹️ How it Works <a id="how-it-works"></a>

Detailed guide on using each utility and the dashboard.

### 🏠 Customizable Dashboard <a id="customizable-dashboard"></a>
1. **View all tools** at a glance on the main landing page.
2. **Personalize your layout**:
   - **Reorder Tools**: Simply drag and drop the tool cards to prioritize the ones you use most.
3. **Persistent State**: Your custom order is automatically saved to `localStorage`, so your workspace stays exactly how you left it.

### 🧮 Rule of Three Calculator <a id="rule-of-three-calculator"></a>
Solve mathematical proportions quickly using the direct rule of three ($A$ is to $B$, as $C$ is to $X$).

1. **Enter your values** into the proportional fields:
   - **A**: The first known quantity.
   - **B**: The second known quantity related to A.
   - **C**: The third known quantity for which you want to find the proportional value ($X$).
2. **Real-time Feedback**: As you interact with the tool, several things happen simultaneously:
   - **Live Formula**: The mathematical expression updates dynamically below the inputs, showing exactly how the result is being derived.
   - **Automatic Calculation**: The result (**$X$**) is computed instantly once all three fields contain valid numbers.
   - **Intelligent Formatting**: The tool handles both large integers and precise decimals, automatically switching to scientific notation for extremely small values to maintain clarity.

> [!NOTE]
> **Desktop Version**
> If you prefer using a desktop program instead of the browser app, you can try the free desktop version I also created:
> 👉 **[Rule Of Three Calculator (Desktop)](https://github.com/Devilquest/Rule-of-Three-Calculator)**
> 
> It’s just as easy to use, lightweight, and completely free.

### 🖼️ Aspect Ratio Calculator <a id="aspect-ratio-calculator"></a>
Perfect for resizing images, videos, or UI components while maintaining their proportions.

1. **Define your Ratio**:
   - **Presets**: Select from a dropdown of standard ratios (e.g., 16:9 for HD, 1:1 for Square).
   - **Custom Ratio**: Manually enter any values in the **Width : Height** ratio fields.
2. **Scale your Dimensions**:
   - Enter a value for either **Width** or **Height**.
   - The tool will **instantly calculate** the missing dimension based on your defined ratio.
3. **Smart Features**:
   - **Ratio Inference**: If you already have both dimensions and want to find their simplest ratio, click **Calculate Aspect Ratio**.
   - **GCD Logic**: The tool automatically finds the Greatest Common Divisor to provide the most simplified ratio (e.g., converting 1920:1080 into 16:9).
   - **Bidirectional editing**: You can switch between editing Width and Height, and the tool will always calculate the opposite value.

### 🏦 Tax Calculator <a id="tax-calculator"></a>
A versatile tool for calculating taxes using either a flat rate or a progressive bracket system.

1. **Choose your Mode**:
   - **Basic Mode**: For simple flat-rate taxes like VAT, corporate tax, or capital gains.
   - **Advanced Mode**: For progressive income taxes where different portions of your income are taxed at different rates.
2. **Define the Flow**:
   - By default, it calculates **Gross → Net**.
   - Toggle **"Calculate from Net Amount"** to switch to **Net → Gross** mode (perfect for negotiating salaries or finding target profits).
3. **Customize your Brackets**:
   - In Advanced mode, you can fully edit the tax ranges.
   - Use **Add Bracket** or **Remove** to match your local tax laws.
   - Changes to a bracket's upper limit automatically update the starting point of the next one.
4. **Detailed Analysis**:
   - **Live Effective Rate**: View the real percentage of your total income that goes to taxes.
   - **Bracket Breakdown**: See exactly how much tax is generated by each specific income range.

### 🔍 File Metadata Viewer <a id="file-metadata-viewer"></a>
Deep inspection of hidden data, headers, and binary signatures for almost any file format.

1. **Upload your File**: Drag and drop any file into the workspace or use the browser.
2. **Detailed Inspection Panels**:
   - **Formatted View**: A clean, categorized table showing EXIF data (images), ID3 tags (audio), PDF entries, and more.
   - **Raw JSON**: Access the full metadata object as a structured data file.
   - **Hex View**: Inspect the file header at a binary level (first 512 bytes) to analyze file structure.
3. **Advanced Detection**:
   - **AI Prompts**: Automatically identifies and extracts generative prompts from AI-created images (Stable Diffusion, Midjourney, etc.).
   - **MIME & Signature**: Detects the original file format by analyzing its "magic numbers," helpful for identifying corrupted or renamed files.
4. **Export Capabilities**: Directly download the extracted data as a **JSON** or **CSV** file.

### 🎨 Web Color Viewer <a id="web-color-viewer"></a>
Navigate, compare, and organize the 140+ standard CSS web colors with a highly interactive interface.

1. **Curate your Palette**:
   - **Add & Remove**: Scalably build your workspace by adding as many color cards as you need.
   - **Smart Search**: Each card features a searchable selection to find colors by name (e.g., "MediumSlateBlue").
2. **Interactive Organization**:
   - **Drag and Drop**: Manually reorder cards to see how specific colors pair together.
   - **Auto-Sort**: Instantly arrange your palette by **Name**, **Hue** (tonal flow), or **Brightness** (luminance).
3. **Deep Color Inspection**: Click the **Info (i)** button on any card to reveal technical details:
   - **Conversion**: Get the **HEX** and **RGB** codes for the selected color.
   - **Accessibility**: View **Contrast Pills** to check how white or black text performs over the background.
4. **Workflow Features**:
   - **Presets & Import**: Load themed collections or paste a list of color names to generate a palette instantly.
   - **Theme Testing**: Toggle the grid background between light and dark modes to ensure visual consistency.

### ⚔️ CSS Compare <a id="css-compare"></a>
Quickly find duplicates, differences, and shared rules between two different stylesheets.

1. **Import your Codes**: Drop two `.css` files into the dual panels or paste code snippets directly.
2. **Comparison Options**:
   - **Intersection Mode**: When active (default), the tool performs a deep property-level comparison. Even if selectors don't match exactly, it will find shared properties within them.
3. **View the Breakdown**:
   - **Common Rules**: This section displays all code that exists in both files—ideal for auditing and consolidating "base" styles.
   - **Unique Rules**: Two separate blocks showing exactly what styles are exclusive to each file, helping to identify bloat or specific overrides.
4. **Efficiency & Export**: 
   - **Live Stats**: See total rules, common rules count, and unique properties at a glance.
   - **Batch Download**: Save individual sections as new `.css` files or download the entire comparison as a **ZIP archive**.

### ✂️ HTML Extractor <a id="html-extractor"></a>
Clean up bloated HTML by automatically separating inline code into dedicated, external files.

1. **Load your Source**: Drop any `.html` file or paste the code directly into the workspace.
2. **One-Click Separation**: Click **Extract Blocks** to strip all inline `<style>` and `<script>` tags. The tool automatically resolves indentation (dedenting) to keep your code clean.
3. **Smart Linking**: The generated **Cleaned HTML** will automatically include the necessary `<link>` and `<script src>` tags to connect your newly separated files.
4. **Organize your Workspace**:
   - **Custom Filenames**: Choose your desired names for the new HTML, CSS, and JS files.
   - **Folder Structure**: Enable **Organize in folders** to automatically place styles in a `styles/` folder and scripts in a `scripts/` folder.
5. **Preview & Export**:
   - **ZIP Download**: Download the entire organized project structure in a single archive.
   - **Live Preview**: Use the built-in iframe to verify that the extracted components still function perfectly together.

### 📦 HTML Merger <a id="html-merger"></a>
The opposite of the Extractor—bundle multiple external assets into a single, standalone HTML file.

1. **Upload your Components**:
   - **Base HTML**: Provide the main structure.
   - **Assets**: Drop multiple `.css` and `.js` files into their respective drop zones.
2. **Intelligent Bundling**: Click **Merge Files** to initiate the process. The tool automatically injects the CSS into `<style>` blocks in the header and the JavaScript into `<script>` blocks at the end of the body.
3. **Review & Test**:
   - **Size Analysis**: View stats on how many files were merged and the final weight of your standalone document.
   - **Live Preview**: Verify that all styles and logic work as expected in the integrated view.
4. **Export**: Copy the final source code or download the self-contained `.html` file, ready for distribution or offline use.

### 🧹 Style Stripper <a id="style-stripper"></a>
Sanitize your code by removing styling clutter, inline attributes, and design-focused logic.

1. **Select your Source**: Paste your code or upload a file (.html, .js, .jsx, etc.) to the stripper.
2. **Define Stripping Depth**:
   - **Attribute Stripping**: Instantly wipes all `class`, `className`, and `style` attributes from your HTML tags.
   - **Internal Styles**: Option to remove all `<style>` blocks entirely.
   - **Safe Mode**: Toggle **Comment instead of deleting** to keep the original code as comments for later reference.
3. **Deep Logic Extraction**: 
   - **JS Cleaning**: Automatically identifies and removes JavaScript methods that manipulate the DOM's appearance (like `.classList.add()` or `.style.display`).
   - **Orphan Variables**: Clean up selector variables (e.g., `const header = ...`) that were only used for styling.
4. **Verification Tools**:
   - **Visual Diff**: A detailed "before and after" view highlighting exactly what was stripped.
   - **Efficiency Score**: See a report on the total items removed and the percentage of file size reduction.
   - **Live Preview**: Use the integrated preview to verify the structural integrity of your code after stripping the styles.
5. **Ready for Use**: Copy the structure-only code or download it as a "stripped" version of your original file.

---

## 🎯 Motivation <a id="motivation"></a>

The transition to **ToolboxHub** was driven by the need to solve the fragmentation of small, single-purpose tools. Development focused on two primary goals:

1.  **Maintenance Efficiency**: Moving away from multiple servers and domains to a single source of truth.
2.  **Code Scalability**: Implementing a strict **"Rule of Two"**—if a function or component is used by two or more tools, it is extracted into the global core. This ensures that the codebase remains lean and that improvements to a single utility benefit the entire hub instantly.

Some tools were created for specific past projects, while others are daily drivers. Centralizing them ensures even the niche utilities remain available and maintained without added overhead.

---
---

# 💻 Technical Deep Dive

---

## 🚀 Getting Started <a id="getting-started"></a>

### 📋 Prerequisites
Because this project utilizes **Modern JavaScript Modules (ES Modules)**, it cannot be run by simply opening the `index.html` file in a browser via the `file://` protocol. You must serve it through a local web server.

- **Python 3.x** (Recommended)
- **Node.js** (Alternative)

### 🛠️ Installation
1. **Clone the repository**:
   ```bash
   git clone https://github.com/Devilquest/ToolboxHub.git
   ```
2. **Navigate to the directory**:
   ```bash
   cd ToolboxHub
   ```
3. **Launch a local server**:
   
   **Using Python (Recommended):**
   ```bash
   python -m http.server 8000
   ```
   **Using Node.js (via serve):**
   ```bash
   npx serve .
   ```

> [!WARNING]  
> **Live Server (VS Code Extension)** is not recommended for this project as it may experience issues handling certain complex module interactions in this specific architecture.

---

## 🏗️ Architecture & Technologies <a id="architecture-technologies"></a>

### Tech Stack

| Technology | Role |
| :--- | :--- |
| **Vanilla JavaScript** | Modular core logic and tool functionality (ESM). |
| **Vanilla CSS3** | Custom properties and modular styling system. |
| **HTML5** | Semantic structure and dynamic component injection. |
| **LocalStorage** | State persistence and user preferences. |
| **[jsdiff](https://github.com/kpdecker/jsdiff)** | The only external library used, specifically for calculating differences in the **Style Stripper** tool. |

> This project uses **0 frameworks** (No React, Vue, or Angular). Everything is built from scratch using native web technologies.

### Core Architecture <a id="core-architecture"></a>
- **Custom Router**: A class-based hash router manages the application state. It facilitates on-demand resource orchestration: for every route change, it asynchronously fetches the required HTML template, injects tool-specific CSS, and dynamically imports the corresponding ES module.
- **Dynamic Module Selection**: Tools are implemented as classes that the router instantiates and cleans up (via a `destroy` method) to ensure memory efficiency and prevent event listener leaks.
- **Configuration-Driven UI**: The entire toolset and its metadata (titles, phrases, storage keys) are defined in a centralized `APP_CONFIG` object, allowing for easy expansion and consistent UI behavior.

### Component & Utility Model <a id="component-utility-model"></a>
- **Web Components Integration**: Uses Custom Elements (e.g., `<app-icon>`) for standardized icon rendering and cross-tool UI consistency.
- **Hybrid Components**: Complex UI elements like the `FileList` or `Toast` notifications are implemented as reusable JS classes.
- **Deduplication Strategy**: Operates on a strict "shared-first" principle. Whenever two or more tools require similar logic or UI elements, the functionality is extracted into global utilities (`ui-utils.js`, `format-utils.js`) or standalone components. This ensures a minimal footprint and consistent behavior across the entire hub.
- **Shared Infrastructure**: A robust `ui-utils.js` layer provides common functionality such as drag-and-drop orchestration, sortable grids, and custom steppers.

### Data Persistence & State <a id="data-persistence-state"></a>
- **Centralized Settings Management**: A global `GlobalSettings` utility acts as the single source of truth for user preferences (currency, number formats, performance settings), persisted via `localStorage`.
- **Privacy-Centric Persistence**: Tool-specific states are stored locally in the browser. Users have granular control through the "Advanced Settings" modal, allowing them to enable/disable or wipe data on a per-tool basis.

### CSS System <a id="css-system"></a>
- **Modular Stylesheets**: Styling is strictly partitioned into Core, Layout, Components, and Tool-specific files to minimize initial payload.
- **Design Tokens**: Utilizes a sophisticated CSS Variable system for theming, enabling consistent colors, spacing, and transition timings across the hub.
- **Performance Optimization**: Implements hardware-accelerated animations and fixed-grid background rendering to ensure 60fps performance even during complex UI transitions.

### Project Structure <a id="project-structure"></a>

```text
.
├── css/                # Modular Styling System
│   ├── components/     # Reusable UI tokens (Buttons, Modals, Inputs)
│   ├── tools/          # Specific styles for each utility tool
│   ├── animations.css  # Global transition and animation keyframes
│   ├── base.css        # CSS Reset and core typography
│   ├── layout.css      # Grid/Flex shells and main workspace layout
│   ├── utilities.css   # Helper classes (margin, padding, display)
│   └── variables.css   # Centralized Design Tokens (Colors, Shadows)
├── html/               # UI Templates and Fragments
│   ├── tools/          # Component-specific HTML structures
│   └── home.html       # The Dashboard/Gallery entry view
├── images/             # Visual Assets
│   ├── tools/          # Icons and thumbnails for each utility
│   └── logo.webp       # Main branding asset
├── js/                 # Application Logic (Vanilla ESM)
│   ├── components/     # Reusable UI Logic (Icons, Toasts, FileLists)
│   ├── tools/          # Business logic for each tool orchestrator
│   ├── utils/          # Specialized helpers (File, UI, Validators)
│   ├── config.js       # Global registry and tool settings
│   └── core.js         # Main Hub orchestrator and SPA Router
└── index.html          # Main application entry point
```

---

## 📖 Usage & Examples <a id="usage-examples"></a>

The hub acts as a Single Page Application (SPA). To add a new tool or modify an existing one, the primary configuration is handled in `js/config.js`.

```javascript
// Example of tool registration in config.js
{ 
    id: 'new-tool', 
    name: 'Awesome Utility', 
    wide: false, 
    phrase: ' to do something cool' 
}
```

Most tools follow a standard lifecycle: Initialization via `core.js`, template loading from `html/`, and logic execution through its respective file in `js/tools/`.

---

## ⚙️ Detailed Tool Logic <a id="detailed-tool-logic"></a>

A technical breakdown of the internal mechanics of each utility.

### 🏠 Customizable Dashboard <a id="customizable-dashboard-logic"></a>
- **State Management**: Orchestrated via the `Home` class, which acts as the lifecycle controller for the main landing view.
- **Interactivity**: Utilizes the `setupSortableGrid` utility to handle native drag-and-drop events on the `.tools-gallery` container. 
- **Persistence**: Upon reordering, it extracts persistent IDs from the DOM and commits them to `localStorage` via the `GlobalSettings.saveToolData` bridge.
- **Real-Time Sync**: Automatically triggers `router.syncSidebarOrder()` post-save to ensure that sidebar navigation links are instantly re-arranged to match the gallery without requiring a page reload.
- **Cleanup**: Implements the `destroy` method to detach observers and transition listeners when the router switches to a different tool.

### 🧮 Rule of Three Calculator <a id="rule-of-three-calculator-logic"></a>
- **Reactive Orchestration**: Managed by the `RuleCalculator` class, which creates a reactive loop between three dependent numeric inputs ($A, B, C$).
- **i18n Compatibility**: Heavily relies on `GlobalSettings.sanitizeInput` and `parseInput` to allow hardware keyboard flexibility while strictly adhering to the user's active decimal separator (dot vs. comma).
- **Calculation Engine**: Listens to `input` and `paste` events to trigger immediate re-computation. It also subscribes to the `GlobalSettings` emitter, allowing it to instantly re-format all current values if the user changes the global number format.
- **Adaptive Formatting**: Implements a dual-mode display logic. It uses standard decimal formatting (with a 5-place precision and trailing zero trimming) for typical proportions, but automatically switches to scientific exponential notation (`toExponential(2)`) for results below $0.01$, appearing as mathematical clarity for scientific use cases.

### 📏 Aspect Ratio Calculator <a id="aspect-ratio-calculator-logic"></a>
- **Greatest Common Divisor (GCD)**: Computes the GCD using the Euclidean algorithm to find the simplest fraction representing any arbitrary dimension pair.
- **Two-Way Binding**: Synchronizes aspect ratio inputs with dimension fields. Changing either the width or height of a target calculation automatically re-computes the missing side based on the defined ratio.
- **Preset Matching**: Continuously monitors custom ratio inputs and attempts to match them against industry standards (e.g., 16:9, 4:3, 21:9) using a tolerance threshold to simplify selection.
- **Precision Control**: Uses `GlobalSettings.formatNumber` to handle fractional pixels, providing precise layout estimates while maintaining readability.

### 🏦 Tax Calculator <a id="tax-calculator-logic"></a>
- **Dynamic Mode Orchestration**: Supports "Basic" (flat rate) and "Advanced" (progressive bracket) modes. The engine iterates through defined tax tiers to calculate total liability across different income levels.
- **Bi-Directional Calculation**: Features complex forward (Gross → Net) and reverse (Net → Gross) logic. The reverse calculation for progressive taxes uses an iterative inversion strategy to determine the pre-tax amount from a target take-home salary.
- **Bracket Management**: Implements a reactive UI for adding, removing, and sorting tax brackets. It uses data-binding to ensure that changes to an upper limit automatically propagate to the starting threshold of the adjacent bracket.
- **Global Settings Integration**: All currency and numeric outputs are automatically formatted based on the user's preference for currency symbols and thousands/decimal separators.

### 🔍 File Metadata Viewer <a id="file-metadata-viewer-logic"></a>
- **Binary Signature Detection**: Employs "Magic Numbers" (file headers) to detect over 30 file formats (PNG, JPEG, PDF, ZIP, etc.) independently of the file extension, providing a secure method for identifying file types.
- **Specialized Parsing**: Features custom decoders for EXIF (JPEG), tEXt (PNG), and ID3 (MP3) tags, extracting hidden technical details like camera settings or bitrates.
- **AI Prompt Discovery**: Specifically optimized for computational art, it can detect and extract hidden ComfyUI and Automatic1111 generation prompts from raw image buffers.
- **Hex Dump Analysis**: Generates a 512-byte hex dump with a side-by-side ASCII representation for low-level file structure inspection.

### 🎨 Web Color Viewer <a id="web-color-viewer-logic"></a>
- **HSL Processing Engine**: Dynamically calculates Hue, Saturation, and Luminance for any valid CSS color using a hardware-accelerated canvas context for accurate conversions.
- **Smart Sorting Algorithms**: Allows organizing color palettes by name, hue, or brightness (luminance), enabling designers to find tonal harmony quickly.
- **Accessibility Verification**: Provides real-time contrast analysis by rendering sample text in white and black over the selected color, helping developers meet WCAG standards.
- **Custom Searchable Components**: Implements a high-performance custom dropdown that filters hundreds of standard web colors with near-zero latency.

### ⚔️ CSS Compare <a id="css-compare-logic"></a>
- **Selector-Based Mapping**: Parses CSS into a structured indexed map of media queries and selectors. This allows for semantic comparison of rules regardless of their original order in the file.
- **Property Intersection Logic**: Detects shared properties within differing rules. If two selectors match but their properties differ, the tool can isolate exactly which declarations are identical.
- **Media Query Awareness**: Correctly handles and groups rules nested inside `@media` and `@keyframes` blocks, ensuring that contextual styles are compared accurately.

### ✂️ HTML Extractor <a id="html-extractor-logic"></a>
- **DOM Deserialization**: Uses `DOMParser` to interact with the source code as a live document, ensuring robust extraction of `<style>` and `<script>` blocks without the fragility of string-based regex.
- **Orchestration & Injection**: Safely removes inline code and replaces it with corresponding `<link>` and `<script src="">` tags, preserving the original head/body hierarchy.
- **Folder-Aware Packaging**: Allows choosing between flat or structured (e.g., `styles/`, `scripts/`) file architectures for the final export.

### 📦 HTML Merger <a id="html-merger-logic"></a>
- **Asset Integration**: The reverse of the Extractor—it reads multiple external CSS and JS files and "re-hydrates" a base HTML template by injecting internal code blocks.
- **Sequential Priority**: Maintains the strict order of input files to preserve the CSS cascade and JavaScript execution sequence.
- **Standalone Portability**: Facilitates the creation of 100% standalone single-file deliverables that work perfectly offline or in restricted environments.

### 🧹 Style Stripper <a id="style-stripper-logic"></a>
- **Regex Cleaning Pipeline**: Uses targeted regular expressions to strip `class`, `style`, and `className` attributes while preserving all non-visual tag attributes.
- **Dead Logic Elimination**: Optionally identifies and removes JavaScript patterns that manipulate the DOM's appearance, such as `classList` methods or `setAttribute('style', ...)`.
- **Diff Analysis**: Integrated with the `jsdiff` library to provide a line-by-line comparison of original vs. stripped code, highlighting removals in real-time.
- **Non-Destructive Trial**: Features a "Comment only" mode that protects original code by wrapping elements in comments instead of deleting them.

---

## 🛠️ Shared Technical Core <a id="shared-technical-core"></a>

The Hub's efficiency is built on a "Shared-First" architecture. Key global utilities orchestrated within `core.js` and `ui-utils.js` serve multiple tools simultaneously, ensuring a minimal code footprint and consistent behavior.

### 🔢 Adaptive Formatting & Sanitization <a id="adaptive-formatting"></a>
*   **Logic**: A centralized normalization engine that handles decimal separators (dot vs. comma) and toggles between standard and scientific notation based on value thresholds.
*   **Used by**: `Rule of Three`, `Aspect Ratio`, `Tax Calculator`, `File Metadata`.

### 🗂️ Drop Zone Orchestration <a id="drop-zone-orchestration"></a>
*   **Logic**: A standardized event-driven module for handling file inputs, drag-over states, and binary buffer reading. It integrates with `GlobalSettings` to respect user-defined storage permissions.
*   **Used by**: `File Metadata`, `HTML Extractor`, `HTML Merger`, `Style Stripper`, `CSS Compare`.

### 📑 Multi-View Tab Interface <a id="multi-view-tab-interface"></a>
*   **Logic**: A unified navigation controller for tools that require switching between "Preview", "Raw Code", "JSON Output", or "Comparison" states without full-page re-renders.
*   **Used by**: `CSS Compare`, `HTML Extractor`, `HTML Merger`, `Style Stripper`, `File Metadata`.

### 🧊 Sortable Grid & Persistence <a id="sortable-grid-persistence"></a>
*   **Logic**: A robust drag-and-drop orchestration layer that manages DOM reordering and serializes the resulting state to `localStorage`.
*   **Used by**: `Dashboard`, `Web Color Viewer`.

### 📦 ZIP Generation Orchestration <a id="zip-generation"></a>
*   **Logic**: A manual ZIP generator without external libraries that handles header construction, CRC-32 calculation, and UTF-8 encoding for filenames (Bit 11).
*   **Used by**: `HTML Extractor`, `CSS Compare`.

### 📢 Global Feedback System <a id="global-feedback-system"></a>
*   **Logic**: An asynchronous "Toast" and inline validation engine that provides real-time status updates (success, error, warning) across all tool instances.
*   **Used by**: `Global` (All Tools).

---

## 🎖️ Credits & Contact <a id="credits-contact"></a>
### Authors
- **Devilquest** - *Lead Architect* - [@devilquest](https://github.com/devilquest)

### Acknowledgments
- **[jsdiff](https://github.com/kpdecker/jsdiff)**: Implementation of high-performance code diffing.
- Inspired by the need for clean, private, and efficient developer utilities.

---

## 📋 Changelog <a id="changelog"></a>
### [1.0.3]
- 🛠️ **System**: Implemented centralized versioning in `APP_CONFIG` and added a version tag in the Global Settings modal.

### [1.0.2]
- 🐛 **HTML Extractor**: Fixed Live Preview instability by replacing temporary Blob URLs with direct code inlining.

### [1.0.1]
- 🐛 **ZIP Generation**: Fixed corrupted ZIP files in HTML Extractor and CSS Compare by correcting header offsets and adding UTF-8 support.

### [1.0.0]
- Initial release.

-   🛠️ **9 core utility tools**:
    -   Rule of Three Calculator
    -   Aspect Ratio Calculator
    -   Tax Calculator
    -   File Metadata Viewer
    -   Web Color Viewer
    -   CSS Compare
    -   HTML Extractor
    -   HTML Merger
    -   Style Stripper
-   ⚙️ **Global settings** for currency, number formatting, and animations.
-   💾 **Local persistence** for tool states and preferences via `localStorage`.
-   🔒 **Privacy-first architecture** with zero server-side data processing.
-   ⚡ **Modular Vanilla JS core** for instant loading and performance.

---

## ⚖️ License <a id="license"></a>
This project is licensed under the [MIT License](LICENSE).

Copyright (c) 2026 Devilquest.

---

## ❤️ Donations
**Donations are always greatly appreciated. Thank you for your support!**

<div align="center">
<a href="https://www.buymeacoffee.com/devilquest" target="_blank"><img src="https://i.imgur.com/RHHFQWs.png" alt="Buy Me A Dinosaur"></a>
</div>