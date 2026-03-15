/**
 * Global Application Configuration and Constants.
 * @type {Object}
 */
export const APP_CONFIG = {
    ui: {
        // --- Timings (ms) ---
        toastDuration: 4000,       // Duration of popup notifications (toasts)
        validationFeedback: 4000,  // Time that an input remains highlighted (red/yellow) on error
        routeTransition: 250,      // Smooth transition time between different tool views
        modalTransition: 300,      // Animation time for opening/closing modals
        accordionTransition: 350,  // Vertical slide animation time for accordion elements
        clipboardFeedback: 2000,   // Delay before resetting copy button state to default

        // --- Measurements (px) ---
        scrollThreshold: 100,      // Pixels to scroll before showing 'scroll to top' button
    },

    defaults: {
        currency: 'USD',
        numberFormat: 'DECIMAL_DOT'
    },

    formats: {
        currencies: {
            EUR: { symbol: '€', position: 'after' },
            GBP: { symbol: '£', position: 'before' },
            INR: { symbol: '₹', position: 'before' },
            JPY: { symbol: '¥', position: 'before' },
            KRW: { symbol: '₩', position: 'before' },
            RUB: { symbol: '₽', position: 'after' },
            USD: { symbol: '$', position: 'before' }
        },
        numberFormats: {
            DECIMAL_DOT: { thou: ',', dec: '.' },
            DECIMAL_COMMA: { thou: '.', dec: ',' }
        }
    },

//=============================================
// Tools Configuration
////=============================================
    tools: {
        defaultOrder: [
            'rule-of-three',
            'aspect-ratio',
            'tax-calculator',
            'file-metadata',
            'web-color-viewer',
            'css-compare',
            'html-extractor',
            'html-merger',
            'style-stripper',
        ],
        list: [
            { id: 'file-metadata', name: 'File Metadata Viewer', wide: false, phrase: ' to feed your metadata obsession' },
            { id: 'rule-of-three', name: 'Rule of Three Calculator', wide: false, phrase: ' for people who think everything is a matter of proportion' },
            { id: 'aspect-ratio', name: 'Aspect Ratio Calculator', wide: false, phrase: ' for true pixel perfectionists' },
            { id: 'css-compare', name: 'CSS Compare', wide: true, phrase: ' for developers allergic to duplicate code' },
            { id: 'html-extractor', name: 'HTML Extractor', wide: false, phrase: ' because CSS and JS deserve their own files' },
            { id: 'html-merger', name: 'HTML Merger', wide: true, phrase: ' when one file is all you need' },
            { id: 'tax-calculator', name: 'Tax Calculator', wide: false, phrase: ' to keep the taxman happy', storageKey: 'taxCalcState' },
            { id: 'style-stripper', name: 'Style Stripper', wide: false, phrase: ' for those who prefer natural beauty over painted interfaces' },
            { id: 'web-color-viewer', name: 'Web Color Viewer', wide: false, phrase: ' to finally see what wheat actually looks like', storageKey: 'wcvPaletteState' },
            { id: 'home', name: 'Home Gallery', wide: false, phrase: 'One toolbox to rule them all', hidden: true },
        ],

//=============================================
// Specific Tool Settings
////=============================================
        taxCalculator: {
            defaultRate: 19,
            defaultBrackets: [
                { min: 0, max: 6000, rate: 19 },
                { min: 6000, max: 50000, rate: 21 },
                { min: 50000, max: 200000, rate: 23 },
                { min: 200000, max: 300000, rate: 27 },
                { min: 300000, max: Infinity, rate: 28 }
            ],
            bracketIncrement: 10000
        },
        webColorViewer: {
            defaultCards: 5,
            gridSizeOptions: [5, 10, 20, 30, 40, 50, 75, 100],
            webColors: [
                "AliceBlue", "AntiqueWhite", "Aqua", "Aquamarine", "Azure", "Beige", "Bisque", "Black",
                "BlanchedAlmond", "Blue", "BlueViolet", "Brown", "BurlyWood", "CadetBlue", "Chartreuse",
                "Chocolate", "Coral", "CornflowerBlue", "Cornsilk", "Crimson", "Cyan", "DarkBlue",
                "DarkCyan", "DarkGoldenRod", "DarkGray", "DarkGreen", "DarkKhaki", "DarkMagenta",
                "DarkOliveGreen", "DarkOrange", "DarkOrchid", "DarkRed", "DarkSalmon", "DarkSeaGreen",
                "DarkSlateBlue", "DarkSlateGray", "DarkTurquoise", "DarkViolet", "DeepPink", "DeepSkyBlue",
                "DimGray", "DodgerBlue", "FireBrick", "FloralWhite", "ForestGreen", "Fuchsia", "Gainsboro",
                "GhostWhite", "Gold", "GoldenRod", "Gray", "Green", "GreenYellow", "HoneyDew", "HotPink",
                "IndianRed", "Indigo", "Ivory", "Khaki", "Lavender", "LavenderBlush", "LawnGreen",
                "LemonChiffon", "LightBlue", "LightCoral", "LightCyan", "LightGoldenRodYellow", "LightGray",
                "LightGreen", "LightPink", "LightSalmon", "LightSeaGreen", "LightSkyBlue", "LightSlateGray",
                "LightSteelBlue", "LightYellow", "Lime", "LimeGreen", "Linen", "Magenta", "Maroon",
                "MediumAquaMarine", "MediumBlue", "MediumOrchid", "MediumPurple", "MediumSeaGreen",
                "MediumSlateBlue", "MediumSpringGreen", "MediumTurquoise", "MediumVioletRed", "MidnightBlue",
                "MintCream", "MistyRose", "Moccasin", "NavajoWhite", "Navy", "OldLace", "Olive", "OliveDrab",
                "Orange", "OrangeRed", "Orchid", "PaleGoldenRod", "PaleGreen", "PaleTurquoise", "PaleVioletRed",
                "PapayaWhip", "PeachPuff", "Peru", "Pink", "Plum", "PowderBlue", "Purple", "RebeccaPurple",
                "Red", "RosyBrown", "RoyalBlue", "SaddleBrown", "Salmon", "SandyBrown", "SeaGreen",
                "SeaShell", "Sienna", "Silver", "SkyBlue", "SlateBlue", "SlateGray", "Snow", "SpringGreen",
                "SteelBlue", "Tan", "Teal", "Thistle", "Tomato", "Turquoise", "Violet", "Wheat", "White",
                "WhiteSmoke", "Yellow", "YellowGreen"
            ],
            presets: [
                {
                    group: "Special Actions",
                    items: [
                        {
                            id: "all-colors",
                            label: "All Web Colors",
                            colors: []
                        }
                    ]
                },
                {
                    group: "The Spectra",
                    items: [
                        {
                            id: "rainbow7",
                            label: "Classic Rainbow (7)",
                            colors: ["Red", "Orange", "Yellow", "Green", "Blue", "Indigo", "Violet"]
                        },
                        {
                            id: "spectrum",
                            label: "Full Spectrum (20)",
                            colors: [
                                "DarkRed", "Red", "Crimson", "OrangeRed", "Tomato",
                                "Orange", "Gold", "Yellow", "Chartreuse",
                                "Lime", "LimeGreen", "Green", "Teal", "Cyan",
                                "DodgerBlue", "RoyalBlue", "Blue", "Indigo", "DarkViolet", "Violet"
                            ]
                        },
                        {
                            id: "rainbow50",
                            label: "Mega Spectrum (50)",
                            colors: [
                                "DarkRed", "FireBrick", "Red", "Crimson", "IndianRed", "LightCoral",
                                "OrangeRed", "Tomato", "Coral", "DarkOrange", "Orange", "Gold",
                                "Yellow", "LightYellow", "LemonChiffon", "PapayaWhip", "Moccasin",
                                "PeachPuff", "PaleGoldenRod", "Khaki", "DarkKhaki", "YellowGreen",
                                "Chartreuse", "LawnGreen", "GreenYellow", "Lime", "LimeGreen",
                                "PaleGreen", "LightGreen", "MediumSpringGreen", "SpringGreen",
                                "MediumSeaGreen", "SeaGreen", "ForestGreen", "Green", "DarkGreen",
                                "DarkOliveGreen", "OliveDrab", "Olive", "Teal", "DarkCyan",
                                "LightSeaGreen", "MediumTurquoise", "Turquoise", "Aqua", "Cyan",
                                "DeepSkyBlue", "DodgerBlue", "RoyalBlue", "Blue", "MidnightBlue",
                                "Indigo", "DarkSlateBlue", "SlateBlue", "MediumSlateBlue", "MediumOrchid",
                                "DarkOrchid", "DarkViolet", "BlueViolet", "Purple", "DarkMagenta",
                                "Magenta", "Fuchsia", "MediumVioletRed", "DeepPink", "HotPink"
                            ]
                        }
                    ]
                },
                {
                    group: "The Four Elements",
                    items: [
                        {
                            id: "fire",
                            label: "Element: Fire",
                            colors: ["Maroon", "DarkRed", "FireBrick", "Red", "Crimson", "OrangeRed", "Tomato", "Coral", "DarkOrange", "Orange", "Gold", "White"]
                        },
                        {
                            id: "earth",
                            label: "Element: Earth",
                            colors: ["DarkOliveGreen", "Olive", "OliveDrab", "ForestGreen", "Green", "DarkGreen", "SeaGreen", "MediumSeaGreen", "SaddleBrown", "Sienna", "Chocolate", "Peru", "DarkGoldenRod", "GoldenRod", "Tan", "BurlyWood"]
                        },
                        {
                            id: "ocean",
                            label: "Element: Water & Ocean",
                            colors: ["MidnightBlue", "Navy", "DarkBlue", "MediumBlue", "Blue", "RoyalBlue", "SteelBlue", "DodgerBlue", "DeepSkyBlue", "SkyBlue", "LightBlue", "PowderBlue", "PaleTurquoise", "Aqua", "Cyan", "White"]
                        },
                        {
                            id: "air",
                            label: "Element: Air & Wind",
                            colors: ["GhostWhite", "WhiteSmoke", "AliceBlue", "Azure", "MintCream", "HoneyDew", "LightCyan", "Lavender", "LightSteelBlue", "Silver", "Gainsboro", "White"]
                        }
                    ]
                },
                {
                    group: "Design Vibes",
                    items: [
                        {
                            id: "cyberpunk",
                            label: "Cyberpunk Neon",
                            colors: ["Black", "MidnightBlue", "Indigo", "Purple", "DarkMagenta", "MediumVioletRed", "DeepPink", "HotPink", "Fuchsia", "BlueViolet", "DarkOrchid", "Aqua"]
                        },
                        {
                            id: "pastel",
                            label: "Pastel Dreams",
                            colors: [
                                "MistyRose", "LavenderBlush", "Lavender", "Thistle", "LightSteelBlue",
                                "AliceBlue", "LightCyan", "LightSkyBlue", "LightYellow", "LemonChiffon",
                                "PeachPuff", "NavajoWhite", "PapayaWhip", "HoneyDew", "PaleGreen",
                                "MintCream", "Azure", "GhostWhite", "WhiteSmoke", "Beige"
                            ]
                        }
                    ]
                },
                {
                    group: "Tonal Presets",
                    items: [
                        { id: "blue", label: "Blue Colors", colors: ["MidnightBlue", "Navy", "DarkBlue", "MediumBlue", "Blue", "RoyalBlue", "SteelBlue", "DodgerBlue", "DeepSkyBlue", "CornflowerBlue", "SkyBlue", "LightSkyBlue", "LightSteelBlue", "LightBlue", "PowderBlue"] },
                        { id: "brown", label: "Brown Colors", colors: ["Maroon", "Brown", "SaddleBrown", "Sienna", "Chocolate", "DarkGoldenrod", "Peru", "RosyBrown", "Goldenrod", "SandyBrown", "Tan", "Burlywood", "Wheat", "NavajoWhite", "Bisque", "BlanchedAlmond", "Cornsilk"] },
                        { id: "cyan", label: "Cyan Colors", colors: ["Teal", "DarkCyan", "LightSeaGreen", "CadetBlue", "DarkTurquoise", "MediumTurquoise", "Turquoise", "Aqua", "Cyan", "Aquamarine", "PaleTurquoise", "LightCyan"] },
                        { id: "green", label: "Green Colors", colors: ["DarkGreen", "Green", "DarkOliveGreen", "ForestGreen", "SeaGreen", "Olive", "OliveDrab", "MediumSeaGreen", "LimeGreen", "Lime", "SpringGreen", "MediumSpringGreen", "DarkSeaGreen", "MediumAquamarine", "YellowGreen", "LawnGreen", "Chartreuse", "LightGreen", "GreenYellow", "PaleGreen"] },
                        { id: "orange", label: "Orange Colors", colors: ["OrangeRed", "Tomato", "DarkOrange", "Coral", "Orange"] },
                        { id: "pink", label: "Pink Colors", colors: ["MediumVioletRed", "DeepPink", "PaleVioletRed", "HotPink", "LightPink", "Pink"] },
                        { id: "purple", label: "Purple & Violet", colors: ["Indigo", "Purple", "DarkMagenta", "DarkViolet", "DarkSlateBlue", "BlueViolet", "DarkOrchid", "Fuchsia", "Magenta", "SlateBlue", "MediumSlateBlue", "MediumOrchid", "MediumPurple", "Orchid", "Violet", "Plum", "Thistle", "Lavender"] },
                        { id: "red", label: "Red Colors", colors: ["DarkRed", "Red", "Firebrick", "Crimson", "IndianRed", "LightCoral", "Salmon", "DarkSalmon", "LightSalmon"] },
                        { id: "yellow", label: "Yellow Colors", colors: ["DarkKhaki", "Gold", "Khaki", "PeachPuff", "Yellow", "PaleGoldenrod", "Moccasin", "PapayaWhip", "LightGoldenrodYellow", "LemonChiffon", "LightYellow"] }
                    ]
                },
                {
                    group: "Grayscale & Whites",
                    items: [
                        { id: "grayBlack", label: "Gray & Black", colors: ["Black", "DarkSlateGray", "DimGray", "SlateGray", "Gray", "LightSlateGray", "DarkGray", "Silver", "LightGray", "Gainsboro"] },
                        { id: "white", label: "White Colors", colors: ["MistyRose", "AntiqueWhite", "Linen", "Beige", "WhiteSmoke", "LavenderBlush", "OldLace", "AliceBlue", "Seashell", "GhostWhite", "Honeydew", "FloralWhite", "Azure", "MintCream", "Snow", "Ivory", "White"] }
                    ]
                }
            ]
        }
    }
};