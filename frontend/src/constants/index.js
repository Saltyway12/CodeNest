// Configuration des thèmes visuels disponibles pour l'interface utilisateur
// Chaque thème contient un nom, un libellé d'affichage et une palette de couleurs
export const THEMES = [
	{
		name: "light",
		label: "Light",
		colors: ["#ffffff", "#5a67d8", "#8b5cf6", "#1a202c"],
	},
	{
		name: "dark",
		label: "Dark",
		colors: ["#1f2937", "#8b5cf6", "#ec4899", "#1a202c"],
	},
	{
		name: "cupcake",
		label: "Cupcake",
		colors: ["#f5f5f4", "#65c3c8", "#ef9fbc", "#291334"],
	},
	{
		name: "forest",
		label: "Forest",
		colors: ["#1f1d1d", "#3ebc96", "#70c217", "#e2e8f0"],
	},
	{
		name: "bumblebee",
		label: "Bumblebee",
		colors: ["#ffffff", "#f8e36f", "#f0d50c", "#1c1917"],
	},
	{
		name: "emerald",
		label: "Emerald",
		colors: ["#ffffff", "#66cc8a", "#3b82f6", "#1e3a8a"],
	},
	{
		name: "corporate",
		label: "Corporate",
		colors: ["#ffffff", "#4b6bfb", "#7b92b2", "#1d232a"],
	},
	{
		name: "synthwave",
		label: "Synthwave",
		colors: ["#2d1b69", "#e779c1", "#58c7f3", "#f8f8f2"],
	},
	{
		name: "retro",
		label: "Retro",
		colors: ["#e4d8b4", "#ea6962", "#6aaa64", "#282425"],
	},
	{
		name: "cyberpunk",
		label: "Cyberpunk",
		colors: ["#ffee00", "#ff7598", "#75d1f0", "#1a103d"],
	},
	{
		name: "valentine",
		label: "Valentine",
		colors: ["#f0d6e8", "#e96d7b", "#a991f7", "#37243c"],
	},
	{
		name: "halloween",
		label: "Halloween",
		colors: ["#0d0d0d", "#ff7800", "#006400", "#ffffff"],
	},
	{
		name: "garden",
		label: "Garden",
		colors: ["#e9e7e7", "#ec4899", "#16a34a", "#374151"],
	},
	{
		name: "aqua",
		label: "Aqua",
		colors: ["#193549", "#4cd4e3", "#9059ff", "#f8d766"],
	},
	{
		name: "lofi",
		label: "Lofi",
		colors: ["#0f0f0f", "#1a1919", "#232323", "#2c2c2c"],
	},
	{
		name: "pastel",
		label: "Pastel",
		colors: ["#f7f3f5", "#d1c1d7", "#a1e3d8", "#4a98f1"],
	},
	{
		name: "fantasy",
		label: "Fantasy",
		colors: ["#ffe7d6", "#a21caf", "#3b82f6", "#f59e0b"],
	},
	{
		name: "wireframe",
		label: "Wireframe",
		colors: ["#e6e6e6", "#b3b3b3", "#b3b3b3", "#888888"],
	},
	{
		name: "black",
		label: "Black",
		colors: ["#000000", "#191919", "#313131", "#4a4a4a"],
	},
	{
		name: "luxury",
		label: "Luxury",
		colors: ["#171618", "#1e293b", "#94589c", "#d4a85a"],
	},
	{
		name: "dracula",
		label: "Dracula",
		colors: ["#282a36", "#ff79c6", "#bd93f9", "#f8f8f2"],
	},
	{
		name: "cmyk",
		label: "CMYK",
		colors: ["#f0f0f0", "#0891b2", "#ec4899", "#facc15"],
	},
	{
		name: "autumn",
		label: "Autumn",
		colors: ["#f2f2f2", "#8c1f11", "#f28c18", "#6f4930"],
	},
	{
		name: "business",
		label: "Business",
		colors: ["#f5f5f5", "#1e40af", "#3b82f6", "#f97316"],
	},
	{
		name: "acid",
		label: "Acid",
		colors: ["#110e0e", "#ff00f2", "#ff7a00", "#99ff01"],
	},
	{
		name: "lemonade",
		label: "Lemonade",
		colors: ["#ffffff", "#67e8f9", "#f5d742", "#2c3333"],
	},
	{
		name: "night",
		label: "Night",
		colors: ["#0f172a", "#38bdf8", "#818cf8", "#e2e8f0"],
	},
	{
		name: "coffee",
		label: "Coffee",
		colors: ["#20161f", "#dd9866", "#497174", "#eeeeee"],
	},
	{
		name: "winter",
		label: "Winter",
		colors: ["#ffffff", "#0284c7", "#d946ef", "#0f172a"],
	},
	{
		name: "dim",
		label: "Dim",
		colors: ["#1c1c27", "#10b981", "#ff5a5f", "#0f172a"],
	},
	{
		name: "nord",
		label: "Nord",
		colors: ["#eceff4", "#5e81ac", "#81a1c1", "#3b4252"],
	},
	{
		name: "sunset",
		label: "Sunset",
		colors: ["#1e293b", "#f5734c", "#ec4899", "#ffffff"],
	},
];

// Liste des langues naturelles supportées pour l'apprentissage linguistique
// Utilisée dans les sélecteurs de langue maternelle et d'apprentissage
export const LANGUAGES = [
	"English",
	"Español",
	"Français",
	"Deutsch",
	"中文",
	"日本語",
	"한국어",
	"हिन्दी",
	"Русский",
	"Português",
	"العربية",
	"Italiano",
	"Türkçe",
	"Nederlands",
	"Polski",
	"Svenska",
	"Norsk",
	"Dansk",
	"Suomi",
	"Ελληνικά",
	"עברית",
	"ไทย",
	"Tiếng Việt",
	"Bahasa Indonesia",
	"Українська",
	"Čeština",
	"Română",
	"Magyar",
	"Български",
];

// Mapping des noms de langues vers les codes de drapeaux nationaux
// Utilisé pour l'affichage des icônes de drapeaux dans l'interface
export const LANGUAGE_TO_FLAG = {
	english: "gb",
	español: "es",
	français: "fr",
	deutsch: "de",
	中文: "cn",
	日本語: "jp",
	한국어: "kr",
	हिन्दी: "in",
	русский: "ru",
	português: "pt",
	العربية: "sa",
	italiano: "it",
	türkçe: "tr",
	nederlands: "nl",
	polski: "pl",
	svenska: "se",
	norsk: "no",
	dansk: "dk",
	suomi: "fi",
	ελληνικά: "gr",
	עברית: "il",
	ไทย: "th",
	"tiếng việt": "vn",
	"bahasa indonesia": "id",
	українська: "ua",
	čeština: "cz",
	română: "ro",
	magyar: "hu",
	български: "bg",
};

// Liste des langages de programmation supportés dans l'éditeur de code
// Utilisée pour les sélecteurs et la coloration syntaxique
export const PROGRAMMING_LANGUAGES = [
	"JavaScript",
	"Python",
	"Java",
	"TypeScript",
	"C++",
	"C#",
	"C",
	"PHP",
	"Go",
	"Rust",
	"Swift",
	"Kotlin",
	"Ruby",
	"Dart",
	"Scala",
	"R",
	"Perl",
	"Haskell",
	"Lua",
	"Elixir",
	"Clojure",
	"F#",
	"Objective-C",
	"Shell",
	"PowerShell",
	"SQL",
	"HTML",
	"CSS",
	"SASS",
	"Less",
	"Vue",
	"React",
	"Angular",
	"Svelte",
];

// Mapping des langages de programmation vers leurs icônes respectives
// Utilise le CDN DevIcons pour l'affichage des logos de technologies
export const PROGRAMMING_LANGUAGE_TO_ICON = {
	javascript:
		"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
	python:
		"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
	java: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg",
	typescript:
		"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
	"c++":
		"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg",
	"c#": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg",
	c: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg",
	php: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg",
	go: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg",
	rust: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg",
	swift:
		"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg",
	kotlin:
		"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg",
	ruby: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg",
	dart: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dart/dart-original.svg",
	scala:
		"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/scala/scala-original.svg",
	r: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/r/r-original.svg",
	perl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/perl/perl-original.svg",
	haskell:
		"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/haskell/haskell-original.svg",
	lua: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/lua/lua-original.svg",
	elixir:
		"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/elixir/elixir-original.svg",
	clojure:
		"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/clojure/clojure-original.svg",
	"f#": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fsharp/fsharp-original.svg",
	"objective-c":
		"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/objectivec/objectivec-plain.svg",
	shell:
		"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg",
	powershell:
		"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/powershell/powershell-original.svg",
	sql: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg",
	html: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
	css: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
	sass: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sass/sass-original.svg",
	less: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/less/less-plain-wordmark.svg",
	vue: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg",
	react:
		"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
	angular:
		"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg",
	svelte:
		"https://cdn.jsdelivr.net/gh/devicons/devicon/icons/svelte/svelte-original.svg",
};
