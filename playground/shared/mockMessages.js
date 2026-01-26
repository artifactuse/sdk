// artifactuse/examples/mockMessages.js
// Comprehensive mock messages for testing all artifact types

export const messages = [
  // ============================================================
  // FORM ARTIFACTS
  // ============================================================
  
  {
    id: 'form-contact',
    content: `
Here's a contact form:

\`\`\`form
{
  "title": "Contact Us",
  "description": "We'd love to hear from you!",
  "variant": "fields",
  "display": "inline",
  "data": {
    "fields": [
      { "name": "name", "type": "text", "label": "Full Name", "required": true, "placeholder": "John Doe" },
      { "name": "email", "type": "email", "label": "Email Address", "required": true },
      { "name": "subject", "type": "select", "label": "Subject", "options": ["General Inquiry", "Support", "Sales", "Partnership"] },
      { "name": "message", "type": "textarea", "label": "Message", "rows": 4 },
      {
        "type": "buttons",
        "fields": [
          { "type": "button", "label": "Cancel", "action": "cancel", "variant": "ghost" },
          { "type": "button", "label": "Send Message", "action": "submit", "variant": "primary" }
        ]
      }
    ]
  }
}
\`\`\`
`
  },
    
  {
    id: 'json-data-001',
    content: `
Here's a contact form:

\`\`\`json
{
  "title": "Contact Us",
  "description": "We'd love to hear from you!",
  "variant": "fields",
  "display": "inline",
  "data": {
    "fields": [
      { "name": "name", "type": "text", "label": "Full Name", "required": true, "placeholder": "John Doe" },
      { "name": "email", "type": "email", "label": "Email Address", "required": true },
      { "name": "subject", "type": "select", "label": "Subject", "options": ["General Inquiry", "Support", "Sales", "Partnership"] },
      { "name": "message", "type": "textarea", "label": "Message", "rows": 4 },
      {
        "type": "buttons",
        "fields": [
          { "type": "button", "label": "Cancel", "action": "cancel", "variant": "ghost" },
          { "type": "button", "label": "Send Message", "action": "submit", "variant": "primary" }
        ]
      }
    ]
  }
}
\`\`\`
`
  },
  {
    id: "html-content-23",
    content: `
      this is suppose to be html
\`\`\`html 
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Adora - AI Journey Mapping</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .scribble-underline {
            position: relative;
            display: inline-block;
        }
        .scribble-underline::after {
            content: '';
            position: absolute;
            left: 0;
            bottom: -5px;
            width: 100%;
            height: 8px;
            background-image: url("data:image/svg+xml,%3Csvg width='100' height='10' viewBox='0 0 100 10' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 5C20 8 40 2 98 5' stroke='%23818cf8' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-size: 100% 100%;
            z-index: -1;
        }
        .blob-bg {
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23F3F4F6' d='M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.3C93.5,8.6,82.2,21.5,70.6,32.2C59,42.9,47.1,51.4,34.8,58.3C22.5,65.2,9.8,70.5,-1.9,73.8C-13.6,77.1,-24.3,78.4,-34.8,73.8C-45.3,69.2,-55.6,58.7,-64.7,47.1C-73.8,35.5,-81.7,22.8,-83.3,9.3C-84.9,-4.2,-80.2,-18.5,-71.8,-30.3C-63.4,-42.1,-51.3,-51.4,-38.9,-59.3C-26.5,-67.2,-13.8,-73.7,0.7,-74.9C15.2,-76.1,30.5,-72,44.7,-76.4Z' transform='translate(100 100)' /%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-size: cover;
        }
    </style>
</head>
<body class="bg-white text-gray-900 antialiased">
    <!-- Navbar -->
    <nav class="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-20">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                        <i data-lucide="sparkles" class="w-5 h-5"></i>
                    </div>
                    <span class="font-bold text-xl tracking-tight text-indigo-900">Adora</span>
                </div>
                
                <div class="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-600">
                    <a href="#" class="hover:text-indigo-600 flex items-center gap-1">Product <i data-lucide="chevron-down" class="w-3 h-3"></i></a>
                    <a href="#" class="hover:text-indigo-600 flex items-center gap-1">Getting started <i data-lucide="chevron-down" class="w-3 h-3"></i></a>
                    <a href="#" class="hover:text-indigo-600 flex items-center gap-1">Company <i data-lucide="chevron-down" class="w-3 h-3"></i></a>
                </div>

                <div class="flex items-center gap-4">
                    <a href="#" class="text-sm font-medium text-gray-600 hover:text-indigo-600">Login</a>
                    <a href="#" class="bg-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Join Waitlist</a>
                </div>
            </div>
        </div>
    </nav>
    <!-- Hero Section -->
    <section class="pt-32 pb-20 overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            
            <!-- Decorative Elements -->
            <div class="absolute top-32 left-10 opacity-20 hidden lg:block">
                <i data-lucide="cloud" class="w-24 h-24 text-blue-400"></i>
            </div>
            <div class="absolute top-40 right-10 opacity-20 hidden lg:block">
                <i data-lucide="cloud" class="w-32 h-32 text-blue-400"></i>
            </div>

            <h1 class="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
                AI journey <span class="scribble-underline text-indigo-600">mapping</span><br>
                with user insights
            </h1>
            
            <p class="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
                Every journey, every screen, every interaction. Your entire product mapped for you, overlaid with analytics, replays and made searchable.
            </p>

            <div class="flex justify-center items-center gap-4 mb-16">
                <button class="bg-indigo-600 text-white px-8 py-3 rounded-full font-medium hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200">
                    Join Waitlist
                </button>
                <button class="flex items-center gap-2 text-gray-700 font-medium px-6 py-3 rounded-full hover:bg-gray-50 transition-colors border border-gray-200">
                    <i data-lucide="play" class="w-4 h-4 fill-current"></i> Watch video
                </button>
            </div>

            <!-- Dashboard Image -->
            <div class="relative mx-auto max-w-6xl">
                <div class="bg-gray-900 rounded-2xl p-2 shadow-2xl border border-gray-200">
                    <img src="https://placehold.co/1200x700/f3f4f6/d1d5db?text=Interactive+Journey+Map+Dashboard" alt="Dashboard" class="rounded-xl w-full h-auto">
                </div>
                <!-- Floating Elements simulating the design -->
                <div class="absolute -bottom-10 -left-10 w-40 h-40 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div class="absolute -top-10 -right-10 w-40 h-40 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            </div>
        </div>
    </section>
    <!-- Social Proof -->
    <section class="py-12 border-b border-gray-100">
        <div class="max-w-7xl mx-auto px-4 text-center">
            <p class="text-2xl font-bold text-gray-900 mb-8">
                Your product team's new <span class="text-pink-500 relative">source-of-truth <i data-lucide="sparkle" class="w-4 h-4 absolute -top-2 -right-4 text-pink-400"></i></span>
            </p>
            <p class="text-sm text-gray-500 mb-8 uppercase tracking-wider">Loved by product-obsessed teams</p>
            <div class="flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                <!-- Using text for logos as placeholders -->
                <span class="text-xl font-bold font-serif">Canva</span>
                <span class="text-xl font-bold font-mono">Notion</span>
                <span class="text-xl font-bold">Linktree*</span>
                <span class="text-xl font-bold flex items-center gap-1"><i data-lucide="hexagon" class="w-5 h-5"></i> Relevance AI</span>
                <span class="text-xl font-bold">CoinTracker</span>
            </div>
        </div>
    </section>
    <!-- Feature 1: Visualize -->
    <section class="py-24 bg-gray-50/50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex flex-col md:flex-row justify-between items-end mb-12">
                <div class="max-w-xl">
                    <span class="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold tracking-wide mb-4 border border-indigo-200">REAL-TIME</span>
                    <h2 class="text-4xl font-bold text-gray-900 mb-4">Visualise your product experience</h2>
                </div>
                <p class="text-gray-600 max-w-md text-sm leading-relaxed">
                    Adora maps your entire product as users navigate it, making every screen and behavior instantly searchable. Want to see your pricing page activity? Just ask Adora.
                </p>
            </div>
            <!-- Horizontal Scroll Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- Card 1 -->
                <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-xs font-semibold text-gray-500">Profile Creation</span>
                        <span class="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full">LIVE</span>
                    </div>
                    <img src="https://placehold.co/300x200/eef2ff/6366f1?text=Profile+Flow" class="w-full rounded-lg mb-4 border border-gray-100">
                    <div class="space-y-2">
                        <div class="flex justify-between text-xs text-gray-500">
                            <span>Split testing</span>
                            <span class="text-gray-900">In progress</span>
                        </div>
                        <div class="flex justify-between text-xs text-gray-500">
                            <span>Last synced</span>
                            <span class="text-gray-900">30 sec ago</span>
                        </div>
                    </div>
                </div>
                <!-- Card 2 -->
                <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-xs font-semibold text-gray-500">User Details</span>
                        <span class="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full">LIVE</span>
                    </div>
                    <img src="https://placehold.co/300x200/fff7ed/f97316?text=Onboarding" class="w-full rounded-lg mb-4 border border-gray-100">
                    <div class="space-y-2">
                        <div class="flex justify-between text-xs text-gray-500">
                            <span>Screen last synced</span>
                            <span class="text-gray-900">30 sec ago</span>
                        </div>
                        <div class="flex justify-between text-xs text-gray-500">
                            <span>V1.2 released</span>
                            <span class="text-gray-900">23d ago</span>
                        </div>
                    </div>
                </div>
                <!-- Card 3 -->
                <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-xs font-semibold text-gray-500">Collections</span>
                        <span class="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full">LIVE</span>
                    </div>
                    <img src="https://placehold.co/300x200/f0fdf4/22c55e?text=Collections" class="w-full rounded-lg mb-4 border border-gray-100">
                    <div class="space-y-2">
                        <div class="flex justify-between text-xs text-gray-500">
                            <span>Screen last synced</span>
                            <span class="text-gray-900">16d ago</span>
                        </div>
                        <div class="flex justify-between text-xs text-gray-500">
                            <span>V2.38 released</span>
                            <span class="text-gray-900">16d ago</span>
                        </div>
                    </div>
                </div>
                 <!-- Card 4 -->
                 <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-xs font-semibold text-gray-500">Homepage</span>
                        <span class="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full">LIVE</span>
                    </div>
                    <img src="https://placehold.co/300x200/fdf4ff/d946ef?text=Home" class="w-full rounded-lg mb-4 border border-gray-100">
                    <div class="space-y-2">
                        <div class="flex justify-between text-xs text-gray-500">
                            <span>Screen last synced</span>
                            <span class="text-gray-900">49 sec ago</span>
                        </div>
                        <div class="flex justify-between text-xs text-gray-500">
                            <span>V4.2 released</span>
                            <span class="text-gray-900">29d ago</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- Testimonial Green -->
    <section class="py-12 px-4">
        <div class="max-w-5xl mx-auto bg-[#d9f99d] rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
            <!-- Decorative shapes -->
            <div class="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <svg width="100%" height="100%">
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="black" stroke-width="1"/>
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>
            <div class="relative w-full md:w-1/2">
                <img src="https://placehold.co/500x400/166534/ffffff?text=Alex+Photo" class="rounded-2xl shadow-lg rotate-2 transform hover:rotate-0 transition-transform duration-300">
                <!-- Sticker decorations -->
                <div class="absolute -bottom-4 -left-4 bg-purple-600 text-white p-2 rounded-lg font-mono text-xs font-bold shadow-lg">XO</div>
                <div class="absolute -bottom-4 left-8 bg-black text-white p-2 rounded-lg font-mono text-xs font-bold shadow-lg">L1</div>
            </div>
            <div class="w-full md:w-1/2 z-10">
                <i data-lucide="quote" class="w-10 h-10 text-green-800 mb-6 fill-current opacity-50"></i>
                <h3 class="text-2xl md:text-3xl font-bold text-green-900 mb-6 leading-snug">
                    "Adora is a product team's cheat-code to building cohesive end-to-end journeys."
                </h3>
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-green-800 rounded-full flex items-center justify-center text-white font-bold">AZ</div>
                    <div>
                        <p class="font-bold text-green-900">Alex Zaccaria</p>
                        <p class="text-green-800 text-sm">Co-founder and CEO of Linktree</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- Feature 2: Variations -->
    <section class="py-24">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="bg-[#f3f4f6] rounded-3xl p-8 md:p-16 relative overflow-hidden">
                <div class="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 class="text-4xl font-bold text-gray-900 mb-6 relative inline-block">
                            All your product's variations
                            <svg class="absolute -top-6 -right-8 w-8 h-8 text-pink-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z"/></svg>
                            <svg class="absolute -bottom-4 right-0 w-24 h-12 text-purple-400" viewBox="0 0 100 50" fill="none" stroke="currentColor" stroke-width="2"><path d="M0 20 Q 50 50 100 10" /></svg>
                        </h2>
                        <p class="text-gray-600 mb-8">
                            Build with all your product states in mind—from the high-fives to the head-scratchers! See every variation in one place.
                        </p>
                        <div class="bg-white p-6 rounded-2xl shadow-lg max-w-sm">
                            <h4 class="font-bold mb-2">Sign into your account</h4>
                            <p class="text-xs text-gray-500 mb-4">or create a new account in minutes</p>
                            <div class="flex items-center gap-2 bg-gray-50 p-2 rounded mb-2 border border-gray-200">
                                <div class="w-6 h-6 rounded-full bg-yellow-400"></div>
                                <span class="text-sm text-gray-600">priya@gmail.com</span>
                            </div>
                            <button class="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium mb-2">Create new account</button>
                            <p class="text-center text-[10px] text-gray-400">Use phone number instead</p>
                        </div>
                    </div>
                    <div class="relative">
                        <img src="https://placehold.co/600x500/e0e7ff/4f46e5?text=Variations+UI" class="rounded-xl shadow-2xl transform md:rotate-3 hover:rotate-0 transition-all duration-500">
                        <!-- Floating language selector mockup -->
                        <div class="absolute top-10 -left-10 bg-white p-4 rounded-xl shadow-xl border border-gray-100 w-48 hidden md:block">
                            <div class="flex items-center gap-2 mb-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                <span class="text-lg">🇬🇧</span> <span class="text-sm font-medium">English</span> <i data-lucide="check" class="w-3 h-3 ml-auto text-blue-600"></i>
                            </div>
                            <div class="flex items-center gap-2 mb-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                <span class="text-lg">🇫🇷</span> <span class="text-sm font-medium">French</span>
                            </div>
                            <div class="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                <span class="text-lg">🇯🇵</span> <span class="text-sm font-medium">Japanese</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- Superpowers Grid -->
    <section class="py-24">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-16">
                <span class="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-bold tracking-wide mb-4 border border-blue-200">PLATFORM</span>
                <h2 class="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight">
                    Your new product<br>
                    <span class="relative">
                        Superpowers
                        <svg class="absolute -bottom-2 left-0 w-full h-4 text-blue-300" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="3" fill="none"/></svg>
                    </span>
                </h2>
            </div>
            <div class="grid md:grid-cols-3 gap-8">
                <!-- Feature 1 -->
                <div class="bg-gray-50 rounded-3xl p-6 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100 group">
                    <div class="h-48 bg-white rounded-xl mb-6 overflow-hidden border border-gray-200 relative">
                        <img src="https://placehold.co/400x300/f3f4f6/9ca3af?text=Journey+Maps" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
                    </div>
                    <h3 class="text-xl font-bold mb-3">Automated Journey Maps</h3>
                    <p class="text-gray-600 text-sm mb-6">AI captured user journeys across every language, device and cohort.</p>
                    <button class="text-sm font-medium text-gray-900 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100">Learn more</button>
                </div>
                <!-- Feature 2 -->
                <div class="bg-gray-50 rounded-3xl p-6 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100 group">
                    <div class="h-48 bg-white rounded-xl mb-6 overflow-hidden border border-gray-200">
                        <img src="https://placehold.co/400x300/fff7ed/fdba74?text=Session+Replays" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
                    </div>
                    <h3 class="text-xl font-bold mb-3">Session Replays</h3>
                    <p class="text-gray-600 text-sm mb-6">Session replays integrated into your journeys so you can see exactly how users experience your product.</p>
                    <button class="text-sm font-medium text-gray-900 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100">Learn more</button>
                </div>

                <!-- Feature 3 -->
                <div class="bg-gray-50 rounded-3xl p-6 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100 group">
                    <div class="h-48 bg-white rounded-xl mb-6 overflow-hidden border border-gray-200">
                        <img src="https://placehold.co/400x300/f0fdf4/86efac?text=Visual+Analytics" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
                    </div>
                    <h3 class="text-xl font-bold mb-3">Visual Analytics</h3>
                    <p class="text-gray-600 text-sm mb-6">Analytics tied to every screen and journey to understand conversions, sources and cohort insights.</p>
                    <button class="text-sm font-medium text-gray-900 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100">Learn more</button>
                </div>

                <!-- Feature 4 -->
                <div class="bg-gray-50 rounded-3xl p-6 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100 group">
                    <div class="h-48 bg-white rounded-xl mb-6 overflow-hidden border border-gray-200">
                        <img src="https://placehold.co/400x300/eff6ff/93c5fd?text=Frustrations" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
                    </div>
                    <h3 class="text-xl font-bold mb-3">Frustrations</h3>
                    <p class="text-gray-600 text-sm mb-6">Auto-captured user friction triaged and surfaced to you in curated and actionable playlists.</p>
                    <button class="text-sm font-medium text-gray-900 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100">Learn more</button>
                </div>

                <!-- Feature 5 -->
                <div class="bg-gray-50 rounded-3xl p-6 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100 group">
                    <div class="h-48 bg-white rounded-xl mb-6 overflow-hidden border border-gray-200">
                        <img src="https://placehold.co/400x300/faf5ff/d8b4fe?text=Wayback+Machine" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
                    </div>
                    <h3 class="text-xl font-bold mb-3">Wayback machine</h3>
                    <p class="text-gray-600 text-sm mb-6">See how your product has evolved over time and get to the bottom of issues.</p>
                    <button class="text-sm font-medium text-gray-900 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100">Learn more</button>
                </div>

                <!-- Feature 6 -->
                <div class="bg-gray-50 rounded-3xl p-6 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100 group">
                    <div class="h-48 bg-white rounded-xl mb-6 overflow-hidden border border-gray-200 flex items-center justify-center bg-gradient-to-br from-orange-100 to-rose-100">
                        <div class="flex gap-2">
                            <div class="bg-white/80 backdrop-blur p-2 rounded shadow text-xs font-bold">AICPA<br>SOC2</div>
                            <div class="bg-white/80 backdrop-blur p-2 rounded shadow text-xs font-bold">HIPAA<br>Ready</div>
                        </div>
                    </div>
                    <h3 class="text-xl font-bold mb-3">SOC2 Type II & HIPAA Certified</h3>
                    <p class="text-gray-600 text-sm mb-6">Designed to easily, safely and securely integrate with your product's tech stack.</p>
                    <button class="text-sm font-medium text-gray-900 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100">Learn more</button>
                </div>
            </div>
        </div>
    </section>

    <!-- Testimonial Pink -->
    <section class="py-12 px-4">
        <div class="max-w-5xl mx-auto bg-pink-200 rounded-3xl p-8 md:p-12 flex flex-col-reverse md:flex-row items-center gap-10">
            <div class="w-full md:w-1/2 z-10">
                <i data-lucide="quote" class="w-10 h-10 text-pink-800 mb-6 fill-current opacity-50"></i>
                <h3 class="text-xl md:text-2xl font-bold text-pink-900 mb-6 leading-snug">
                    "Adora's unique journey maps have given us deep insight into our user experience. Visualising our product funnel this way, combined with data, empowers our team with the confidence to make faster, smarter design and product decisions."
                </h3>
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold">DH</div>
                    <div>
                        <p class="font-bold text-pink-900">David Higgs</p>
                        <p class="text-pink-800 text-xs">Head of Research, Leonardo AI (Canva)</p>
                    </div>
                </div>
            </div>
            <div class="relative w-full md:w-1/2">
                <img src="https://placehold.co/500x400/be185d/ffffff?text=David+Photo" class="rounded-2xl shadow-lg rotate-[-2deg] transform hover:rotate-0 transition-transform duration-300">
            </div>
        </div>
    </section>

    <!-- Use Cases -->
    <section class="py-24 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-12">
                <span class="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-600 text-xs font-bold tracking-wide mb-4 border border-purple-200">USE CASES</span>
                <h2 class="text-4xl font-bold text-gray-900">Empowering user-<br>obsessed teams</h2>
            </div>

            <!-- Tabs -->
            <div class="flex flex-wrap justify-center gap-4 mb-12">
                <button class="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-200">
                    <i data-lucide="layout" class="w-4 h-4"></i> Onboarding optimization
                </button>
                <button class="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-full text-sm font-medium border border-gray-200 hover:bg-gray-50">
                    <i data-lucide="search" class="w-4 h-4"></i> Uncover Friction
                </button>
                <button class="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-full text-sm font-medium border border-gray-200 hover:bg-gray-50">
                    <i data-lucide="file-text" class="w-4 h-4"></i> Product documentation
                </button>
                <button class="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-full text-sm font-medium border border-gray-200 hover:bg-gray-50">
                    <i data-lucide="bar-chart-2" class="w-4 h-4"></i> Accessible analytics
                </button>
            </div>

            <!-- Content -->
            <div class="bg-gray-50 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-12">
                <div class="w-full md:w-1/3">
                    <h3 class="text-2xl font-bold text-gray-900 mb-4">Uncover Friction</h3>
                    <p class="text-gray-600 leading-relaxed">
                        Spot issues before they escalate with Frustrations. See what users see, pinpoint friction, and align your team on solutions, fast.
                    </p>
                </div>
                <div class="w-full md:w-2/3">
                    <img src="https://placehold.co/800x500/f3f4f6/d1d5db?text=Friction+Analysis+Dashboard" class="rounded-xl shadow-lg w-full">
                </div>
            </div>
        </div>
    </section>

    <!-- Testimonial Blue -->
    <section class="py-12 px-4">
        <div class="max-w-5xl mx-auto bg-sky-200 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
            <div class="relative w-full md:w-1/2">
                <img src="https://placehold.co/500x400/0369a1/ffffff?text=Lauryn+Photo" class="rounded-2xl shadow-lg rotate-2 transform hover:rotate-0 transition-transform duration-300">
                <!-- Arrow doodle -->
                <svg class="absolute -top-8 -right-8 w-16 h-16 text-sky-600 transform rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M12 5l-7 7M12 5l7 7"/></svg>
            </div>
            <div class="w-full md:w-1/2 z-10">
                <i data-lucide="quote" class="w-10 h-10 text-sky-800 mb-6 fill-current opacity-50"></i>
                <h3 class="text-xl md:text-2xl font-bold text-sky-900 mb-6 leading-snug">
                    "Adora is a game-changer for product orgs. My team is continuously shipping experiments. At this scale it's so hard to know exactly what a given customer is experiencing in the product. Adora creates that clarity."
                </h3>
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-black rounded flex items-center justify-center text-white font-bold">N</div>
                    <div>
                        <p class="font-bold text-sky-900">Lauryn Motamedi</p>
                        <p class="text-sky-800 text-xs">Head of Product Growth, Notion</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Integration -->
    <section class="py-24 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-12">
                <span class="inline-block px-3 py-1 rounded-full bg-lime-100 text-lime-700 text-xs font-bold tracking-wide mb-4 border border-lime-200">INTEGRATION</span>
                <h2 class="text-4xl font-bold text-gray-900">Easy to integrate</h2>
            </div>

            <div class="grid md:grid-cols-3 gap-6 mb-12">
                <!-- Step 1 -->
                <div class="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                    <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-6">
                        <i data-lucide="code" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-lg font-bold mb-3">Install the Adora JavaScript snippet</h3>
                    <p class="text-sm text-gray-600">No manual event tagging needed to get started. Set up your privacy controls and any custom cohorts.</p>
                </div>

                <!-- Step 2 -->
                <div class="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                    <div class="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600 mb-6">
                        <i data-lucide="layers" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-lg font-bold mb-3">Let Adora get to work</h3>
                    <p class="text-sm text-gray-600">Adora automatically aggregates all the screens you serve to your users. From pages to dialogs to dropdowns.</p>
                </div>

                <!-- Step 3 -->
                <div class="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                    <div class="w-12 h-12 bg-lime-100 rounded-lg flex items-center justify-center text-lime-600 mb-6">
                        <i data-lucide="check-circle" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-lg font-bold mb-3">You're set up!</h3>
                    <p class="text-sm text-gray-600">Adora is all set up. Enjoy real-time access to your product screens, journeys and all their variations.</p>
                </div>
            </div>

            <!-- Security -->
            <div class="space-y-4">
                <div class="bg-white p-6 rounded-xl border border-gray-100 flex items-center gap-6">
                    <div class="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                        <i data-lucide="shield-check" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-sm">Powerful privacy controls</h4>
                        <p class="text-xs text-gray-500 mt-1">Privacy is our priority. We're SOC2 compliant and let you control exactly what to capture. Nothing more, nothing less.</p>
                        <a href="#" class="text-xs text-indigo-600 font-medium mt-1 inline-block hover:underline">Learn more</a>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-xl border border-gray-100 flex items-center gap-6">
                    <div class="w-10 h-10 bg-lime-50 rounded-full flex items-center justify-center text-lime-600 shrink-0">
                        <i data-lucide="lock" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-sm">Secure by design</h4>
                        <p class="text-xs text-gray-500 mt-1">Your data is protected by SOC2 certified security, built by engineering leaders from Amazon, Canva, and Dropbox.</p>
                        <a href="#" class="text-xs text-indigo-600 font-medium mt-1 inline-block hover:underline">Learn more</a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-white pt-20 pb-10 border-t border-gray-100 relative overflow-hidden">
        <!-- Tape decoration -->
        <div class="absolute top-0 left-10 w-32 h-8 bg-lime-200 opacity-50 rotate-[-5deg] transform -translate-y-1/2"></div>
        <div class="absolute top-0 right-10 w-32 h-8 bg-lime-200 opacity-50 rotate-[5deg] transform -translate-y-1/2"></div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                <div class="col-span-2 md:col-span-1">
                    <div class="flex items-center gap-2 mb-6">
                        <div class="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white">
                            <i data-lucide="sparkles" class="w-3 h-3"></i>
                        </div>
                        <span class="font-bold text-lg text-indigo-900">Adora</span>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-bold text-indigo-900 text-sm mb-4">Product</h4>
                    <ul class="space-y-2 text-xs text-gray-600">
                        <li><a href="#" class="hover:text-indigo-600">Automated Journey Maps</a></li>
                        <li><a href="#" class="hover:text-indigo-600">Session Replay</a></li>
                        <li><a href="#" class="hover:text-indigo-600">Visual Analytics</a></li>
                        <li><a href="#" class="hover:text-indigo-600">Wayback Machine</a></li>
                        <li><a href="#" class="hover:text-indigo-600">Living Product Docs</a></li>
                    </ul>
                </div>

                <div>
                    <h4 class="font-bold text-indigo-900 text-sm mb-4">Getting Started</h4>
                    <ul class="space-y-2 text-xs text-gray-600">
                        <li><a href="#" class="hover:text-indigo-600">Join Waitlist</a></li>
                        <li><a href="#" class="hover:text-indigo-600">Security and Privacy</a></li>
                        <li><a href="#" class="hover:text-indigo-600">Developer Docs</a></li>
                    </ul>
                </div>

                <div>
                    <h4 class="font-bold text-indigo-900 text-sm mb-4">Company</h4>
                    <ul class="space-y-2 text-xs text-gray-600">
                        <li><a href="#" class="hover:text-indigo-600">About Us</a></li>
                        <li><a href="#" class="hover:text-indigo-600">Blog</a></li>
                        <li><a href="#" class="hover:text-indigo-600">Trust Centre</a></li>
                    </ul>
                </div>
            </div>

            <div class="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-gray-500">
                <div class="flex gap-6">
                    <span>© 2025 Adora. All rights reserved.</span>
                    <a href="#" class="hover:text-gray-900">Privacy Policy</a>
                    <a href="#" class="hover:text-gray-900">Terms and Conditions</a>
                </div>
                <div class="flex gap-4">
                    <a href="#" class="hover:text-gray-900"><i data-lucide="twitter" class="w-4 h-4"></i></a>
                    <a href="#" class="hover:text-gray-900"><i data-lucide="linkedin" class="w-4 h-4"></i></a>
                </div>
            </div>
        </div>
    </footer>

    <script>
        lucide.createIcons();
    </script>
</body>
</html>
\`\`\`
    `
  },

  {
    id: 'form-feedback',
    content: `
Quick feedback form:

\`\`\`form
{
  "title": "How was your experience?",
  "variant": "fields",
  "display": "inline",
  "data": {
    "fields": [
      { 
        "name": "rating", 
        "type": "radio", 
        "label": "Rating",
        "options": ["😍 Excellent", "😊 Good", "😐 Okay", "😕 Poor"],
        "required": true 
      },
      { 
        "name": "feedback", 
        "type": "textarea", 
        "label": "Tell us more (optional)",
        "placeholder": "What could we improve?",
        "rows": 2
      },
      {
        "type": "buttons",
        "fields": [
          { "type": "button", "label": "Skip", "action": "cancel", "variant": "ghost" },
          { "type": "button", "label": "Submit Feedback", "action": "submit", "variant": "primary" }
        ]
      }
    ]
  }
}
\`\`\`
`
  },

  {
    id: 'form-signup',
    content: `
Newsletter signup form:

\`\`\`form
{
  "title": "Subscribe to our Newsletter",
  "description": "Get the latest updates delivered to your inbox.",
  "variant": "fields",
  "display": "inline",
  "data": {
    "fields": [
      { "name": "email", "type": "email", "label": "Email", "required": true, "placeholder": "you@example.com" },
      { "name": "interests", "type": "select", "label": "I'm interested in", "options": ["All Updates", "Product News", "Tutorials", "Community"] },
      { "name": "consent", "type": "checkbox", "label": "I agree to receive marketing emails", "required": true },
      {
        "type": "buttons",
        "fields": [
          { "type": "button", "label": "Subscribe", "action": "submit", "variant": "primary" }
        ]
      }
    ]
  }
}
\`\`\`
`
  },

  {
    id: 'form-login',
    content: `
Login form:

\`\`\`form
{
  "title": "Welcome back",
  "description": "Sign in to your account",
  "variant": "fields",
  "display": "inline",
  "data": {
    "fields": [
      { "name": "email", "type": "email", "label": "Email", "required": true },
      { "name": "password", "type": "password", "label": "Password", "required": true },
      { "name": "remember", "type": "checkbox", "label": "Remember me for 30 days" },
      {
        "type": "buttons",
        "fields": [
          { "type": "button", "label": "Forgot password?", "action": "custom", "name": "forgot", "variant": "link" },
          { "type": "button", "label": "Sign In", "action": "submit", "variant": "primary" }
        ]
      }
    ]
  }
}
\`\`\`
`
  },

  {
    id: 'form-buttons-only',
    content: `
What would you like to do?

\`\`\`form
{
  "title": "Choose an action",
  "variant": "buttons",
  "data": {
    "fields": [
      { "type": "button", "label": "📝 Write", "action": "custom", "name": "write", "variant": "secondary" },
      { "type": "button", "label": "🔍 Search", "action": "custom", "name": "search", "variant": "secondary" },
      { "type": "button", "label": "💡 Brainstorm", "action": "custom", "name": "brainstorm", "variant": "secondary" },
      { "type": "button", "label": "🎨 Create", "action": "custom", "name": "create", "variant": "primary" }
    ]
  }
}
\`\`\`
`
  },

  {
    id: 'form-poll',
    content: `
Quick poll:

\`\`\`form
{
  "title": "What's your favorite framework?",
  "variant": "fields",
  "display": "inline",
  "data": {
    "fields": [
      { 
        "name": "framework", 
        "type": "radio", 
        "options": ["React", "Vue", "Svelte", "Angular", "Other"],
        "required": true 
      },
      {
        "type": "buttons",
        "fields": [
          { "type": "button", "label": "Vote", "action": "submit", "variant": "primary" }
        ]
      }
    ]
  }
}
\`\`\`
`
  },

  {
    id: 'form-multi-step',
    content: `
User profile setup:

\`\`\`form
{
  "title": "Complete Your Profile",
  "description": "Step 1 of 2: Basic Information",
  "variant": "fields",
  "display": "panel",
  "data": {
    "fields": [
      { "type": "heading", "label": "Personal Details" },
      { "name": "firstName", "type": "text", "label": "First Name", "required": true },
      { "name": "lastName", "type": "text", "label": "Last Name", "required": true },
      { "name": "bio", "type": "textarea", "label": "Short Bio", "placeholder": "Tell us about yourself...", "rows": 3 },
      { "type": "divider" },
      { "type": "heading", "label": "Preferences" },
      { "name": "timezone", "type": "select", "label": "Timezone", "options": ["UTC-8 (Pacific)", "UTC-5 (Eastern)", "UTC+0 (London)", "UTC+1 (Paris)", "UTC+8 (Singapore)"] },
      { "name": "notifications", "type": "checkbox", "label": "Enable email notifications" },
      {
        "type": "buttons",
        "fields": [
          { "type": "button", "label": "Cancel", "action": "cancel", "variant": "ghost" },
          { "type": "button", "label": "Save & Continue", "action": "submit", "variant": "primary" }
        ]
      }
    ]
  }
}
\`\`\`
`
  },

  {
    id: 'form-confirmation',
    content: `
Are you sure?

\`\`\`form
{
  "title": "Delete Project",
  "description": "This action cannot be undone. All data will be permanently deleted.",
  "variant": "fields",
  "display": "inline",
  "data": {
    "fields": [
      { "name": "confirm", "type": "text", "label": "Type 'DELETE' to confirm", "required": true, "placeholder": "DELETE" },
      {
        "type": "buttons",
        "fields": [
          { "type": "button", "label": "Cancel", "action": "cancel", "variant": "secondary" },
          { "type": "button", "label": "Delete Project", "action": "submit", "variant": "danger" }
        ]
      }
    ]
  }
}
\`\`\`
`
  },

  // ============================================================
  // SOCIAL ARTIFACTS - Twitter/X
  // ============================================================
  
  {
    id: 'social-twitter-basic',
    content: `
Here's a Twitter/X post preview:

\`\`\`social
{
  "platform": "twitter",
  "data": {
    "author": {
      "name": "Artifactuse",
      "handle": "@artifactuse",
      "avatar": "https://pbs.twimg.com/profile_images/placeholder.jpg",
      "verified": true,
      "verifiedType": "blue"
    },
    "content": {
      "text": "Excited to announce Artifactuse SDK v2.0! 🚀\\n\\n• Live code previews\\n• Social post generators\\n• Interactive forms\\n• Canvas & video editors\\n\\nThe future of AI interfaces is here.\\n\\n#AI #DevTools #OpenSource"
    },
    "meta": {
      "timestamp": "2h"
    },
    "engagement": {
      "replies": 42,
      "retweets": 156,
      "likes": 892,
      "views": 12400
    }
  }
}
\`\`\`
`
  },

  {
    id: 'social-twitter-media',
    content: `
Twitter post with image:

\`\`\`social
{
  "platform": "twitter",
  "data": {
    "author": {
      "name": "TechDaily",
      "handle": "@techdaily",
      "avatar": "https://example.com/avatar.jpg",
      "verified": true,
      "verifiedType": "gold"
    },
    "content": {
      "text": "The new MacBook Pro is here. M4 chip, 48GB unified memory, 30-hour battery life. 🔥\\n\\nFirst impressions thread 🧵",
      "media": [
        { "url": "https://example.com/macbook.jpg", "alt": "MacBook Pro M4" }
      ]
    },
    "meta": {
      "timestamp": "5h"
    },
    "engagement": {
      "replies": 234,
      "retweets": 1893,
      "likes": 8420,
      "views": 245000
    }
  }
}
\`\`\`
`
  },

  {
    id: 'social-twitter-poll',
    content: `
Twitter poll:

\`\`\`social
{
  "platform": "twitter",
  "data": {
    "author": {
      "name": "Developer Survey",
      "handle": "@devsurvey",
      "avatar": "https://example.com/avatar.jpg"
    },
    "content": {
      "text": "What's your primary programming language in 2025?",
      "poll": {
        "options": ["TypeScript", "Python", "Rust", "Go"],
        "votes": [42, 31, 15, 12],
        "totalVotes": 8429,
        "duration": "Final results"
      }
    },
    "meta": {
      "timestamp": "Dec 28"
    },
    "engagement": {
      "replies": 156,
      "retweets": 89,
      "likes": 342,
      "views": 45000
    }
  }
}
\`\`\`
`
  },

  {
    id: 'social-twitter-quote',
    content: `
Twitter quote tweet:

\`\`\`social
{
  "platform": "twitter",
  "data": {
    "author": {
      "name": "Sarah Chen",
      "handle": "@sarahchen",
      "avatar": "https://example.com/sarah.jpg",
      "verified": true,
      "verifiedType": "blue"
    },
    "content": {
      "text": "This is huge. The implications for AI-assisted development are massive.",
      "quote": {
        "author": {
          "name": "Artifactuse",
          "handle": "@artifactuse",
          "avatar": "https://example.com/artifactuse.jpg"
        },
        "text": "Announcing Artifactuse SDK v2.0 - Transform AI responses into interactive artifacts."
      }
    },
    "meta": {
      "timestamp": "1h"
    },
    "engagement": {
      "replies": 12,
      "retweets": 45,
      "likes": 234,
      "views": 5600
    }
  }
}
\`\`\`
`
  },

  {
    id: 'social-twitter-link',
    content: `
Twitter post with link preview:

\`\`\`social
{
  "platform": "twitter",
  "data": {
    "author": {
      "name": "Hacker News",
      "handle": "@hackernews",
      "avatar": "https://example.com/hn.jpg",
      "verified": true,
      "verifiedType": "gold"
    },
    "content": {
      "text": "Show HN: Artifactuse - Open-source SDK for AI artifact rendering",
      "link": {
        "url": "https://github.com/artifactuse/sdk",
        "title": "Artifactuse SDK - Transform AI responses into interactive artifacts",
        "description": "Open-source SDK for rendering code previews, forms, social posts, and more from AI responses.",
        "image": "https://example.com/og-image.png",
        "domain": "github.com"
      }
    },
    "meta": {
      "timestamp": "4h"
    },
    "engagement": {
      "replies": 67,
      "retweets": 234,
      "likes": 892,
      "views": 34000
    }
  }
}
\`\`\`
`
  },

  // ============================================================
  // SOCIAL ARTIFACTS - LinkedIn
  // ============================================================

  {
    id: 'social-linkedin-post',
    content: `
LinkedIn post preview:

\`\`\`social
{
  "platform": "linkedin",
  "data": {
    "author": {
      "name": "Sarah Chen",
      "headline": "VP of Engineering at TechCorp | Building the future of AI",
      "avatar": "https://example.com/sarah-avatar.jpg",
      "connection": "1st"
    },
    "content": {
      "text": "Thrilled to share that our team just shipped a major update! 🎉\\n\\nAfter 6 months of hard work, we've completely reimagined our developer experience:\\n\\n→ 50% faster build times\\n→ Native TypeScript support\\n→ Real-time collaboration\\n\\nThis wouldn't have been possible without our incredible engineering team who pushed through countless challenges.\\n\\nWhat's the most impactful shipping moment you've experienced? I'd love to hear your stories.\\n\\n#Engineering #Leadership #ProductDevelopment #TechCareers"
    },
    "meta": {
      "timestamp": "3d"
    },
    "engagement": {
      "likes": 1247,
      "comments": 89,
      "shares": 156
    }
  }
}
\`\`\`
`
  },

  {
    id: 'social-linkedin-article',
    content: `
LinkedIn post with article:

\`\`\`social
{
  "platform": "linkedin",
  "data": {
    "author": {
      "name": "Michael Roberts",
      "headline": "Founder & CEO at StartupXYZ | YC W24",
      "avatar": "https://example.com/michael.jpg",
      "connection": "2nd"
    },
    "content": {
      "text": "I wrote about the 5 lessons I learned raising our Series A in the current market.\\n\\nThe fundraising landscape has changed dramatically. Here's what actually worked for us.\\n\\nLink in comments 👇",
      "link": {
        "url": "https://medium.com/startup-lessons",
        "title": "5 Lessons From Raising a Series A in 2025",
        "description": "The fundraising playbook has changed. Here's what founders need to know.",
        "image": "https://example.com/article-cover.jpg",
        "domain": "medium.com"
      }
    },
    "meta": {
      "timestamp": "1w"
    },
    "engagement": {
      "likes": 3420,
      "comments": 234,
      "shares": 567
    }
  }
}
\`\`\`
`
  },

  {
    id: 'social-linkedin-job',
    content: `
LinkedIn job announcement:

\`\`\`social
{
  "platform": "linkedin",
  "data": {
    "author": {
      "name": "Artifactuse",
      "headline": "We're building the future of AI interfaces",
      "avatar": "https://example.com/artifactuse-logo.jpg"
    },
    "content": {
      "text": "🚀 We're hiring!\\n\\nArtifactuse is looking for passionate engineers to join our team:\\n\\n• Senior Frontend Engineer (React/Vue)\\n• Backend Engineer (Node.js/Python)\\n• Developer Advocate\\n\\nWhat we offer:\\n✓ Competitive salary + equity\\n✓ Remote-first culture\\n✓ Unlimited PTO\\n✓ Learning budget\\n\\nInterested? Drop a comment or DM me directly.\\n\\n#Hiring #RemoteJobs #Engineering #Startup"
    },
    "meta": {
      "timestamp": "2d"
    },
    "engagement": {
      "likes": 456,
      "comments": 78,
      "shares": 123
    }
  }
}
\`\`\`
`
  },

  // ============================================================
  // SOCIAL ARTIFACTS - Instagram
  // ============================================================

  {
    id: 'social-instagram-post',
    content: `
Instagram post preview:

\`\`\`social
{
  "platform": "instagram",
  "data": {
    "author": {
      "name": "wanderlust.adventures",
      "avatar": "https://example.com/travel-avatar.jpg",
      "verified": true
    },
    "content": {
      "text": "Lost in the magic of Santorini 🇬🇷✨\\n\\nThose sunset views hit different when you're watching from a rooftop in Oia. This trip has been an absolute dream.\\n\\nPro tip: Book a sunset dinner at least a week in advance - trust me on this one!\\n\\n📸 Shot on iPhone 15 Pro\\n\\n.\\n.\\n.\\n#Santorini #Greece #TravelGram #Wanderlust #SunsetViews #OiaSantorini #GreekIslands #TravelPhotography #ExploreGreece #BucketList",
      "media": [
        { "url": "https://example.com/santorini-sunset.jpg", "alt": "Santorini sunset over blue domes" }
      ]
    },
    "meta": {
      "timestamp": "August 15",
      "location": "Oia, Santorini"
    },
    "engagement": {
      "likes": 24892,
      "comments": 342
    }
  }
}
\`\`\`
`
  },

  {
    id: 'social-instagram-carousel',
    content: `
Instagram carousel post:

\`\`\`social
{
  "platform": "instagram",
  "data": {
    "author": {
      "name": "foodie.paradise",
      "avatar": "https://example.com/food-avatar.jpg",
      "verified": false
    },
    "content": {
      "text": "Tokyo food tour day 1 🍜🇯🇵\\n\\nSwipe to see all the amazing dishes we tried today →\\n\\n1. Tsukiji Market sushi\\n2. Ramen at Ichiran\\n3. Wagyu beef at Ginza\\n4. Matcha dessert in Harajuku\\n\\nThis city is a foodie's dream come true 😍\\n\\n#Tokyo #JapanFood #FoodTour #Sushi #Ramen #Wagyu #TravelJapan",
      "media": [
        { "url": "https://example.com/sushi.jpg", "alt": "Fresh sushi at Tsukiji" },
        { "url": "https://example.com/ramen.jpg", "alt": "Ichiran ramen" },
        { "url": "https://example.com/wagyu.jpg", "alt": "A5 Wagyu beef" },
        { "url": "https://example.com/matcha.jpg", "alt": "Matcha parfait" }
      ]
    },
    "meta": {
      "timestamp": "2 days ago",
      "location": "Tokyo, Japan"
    },
    "engagement": {
      "likes": 8934,
      "comments": 156
    }
  }
}
\`\`\`
`
  },

  // ============================================================
  // SOCIAL ARTIFACTS - Facebook
  // ============================================================

  {
    id: 'social-facebook-post',
    content: `
Facebook post preview:

\`\`\`social
{
  "platform": "facebook",
  "data": {
    "author": {
      "name": "Mountain View Bakery",
      "avatar": "https://example.com/bakery-logo.jpg"
    },
    "content": {
      "text": "🥐 GRAND OPENING THIS SATURDAY! 🥐\\n\\nWe're so excited to finally open our doors to the Mountain View community!\\n\\nJoin us this Saturday from 7am - 6pm for:\\n✨ Free coffee with any pastry purchase\\n✨ Live music from 10am - 2pm\\n✨ Kids decorating station\\n✨ Raffle for a year of free croissants!\\n\\nBring the whole family - we can't wait to meet you all!\\n\\n📍 123 Main Street, Mountain View\\n🕐 Saturday, January 4th, 7am - 6pm",
      "media": [
        { "url": "https://example.com/bakery-interior.jpg", "alt": "Bakery interior" },
        { "url": "https://example.com/pastry-display.jpg", "alt": "Fresh pastries" }
      ]
    },
    "meta": {
      "timestamp": "5h",
      "visibility": "public"
    },
    "engagement": {
      "reactions": {
        "like": 234,
        "love": 187,
        "haha": 12,
        "wow": 45,
        "sad": 0,
        "angry": 0
      },
      "comments": 67,
      "shares": 89
    }
  }
}
\`\`\`
`
  },

  {
    id: 'social-facebook-event',
    content: `
Facebook event post:

\`\`\`social
{
  "platform": "facebook",
  "data": {
    "author": {
      "name": "Tech Meetup SF",
      "avatar": "https://example.com/meetup-logo.jpg"
    },
    "content": {
      "text": "🎉 Join us for our first meetup of 2025!\\n\\nTopic: Building with AI - From Prototypes to Production\\n\\n📅 January 15, 2025\\n🕖 7:00 PM - 9:00 PM\\n📍 TechHub SF, 456 Innovation Way\\n\\nFeaturing talks from engineers at OpenAI, Anthropic, and Google.\\n\\nPizza and drinks provided! 🍕\\n\\nRSVP link in comments. Space is limited!",
      "link": {
        "url": "https://meetup.com/tech-sf/events/123",
        "title": "Building with AI - From Prototypes to Production",
        "description": "Join us for an evening of talks and networking with AI engineers.",
        "image": "https://example.com/event-banner.jpg",
        "domain": "meetup.com"
      }
    },
    "meta": {
      "timestamp": "1d",
      "visibility": "public"
    },
    "engagement": {
      "reactions": {
        "like": 89,
        "love": 23,
        "wow": 5
      },
      "comments": 34,
      "shares": 56
    }
  }
}
\`\`\`
`
  },

  // ============================================================
  // SOCIAL ARTIFACTS - Threads
  // ============================================================

  {
    id: 'social-threads-post',
    content: `
Threads post preview:

\`\`\`social
{
  "platform": "threads",
  "data": {
    "author": {
      "name": "designerdave",
      "avatar": "https://example.com/dave.jpg",
      "verified": true
    },
    "content": {
      "text": "Hot take: The best design tool is the one your whole team actually uses.\\n\\nFigma, Sketch, Adobe XD - they're all great. But if half your team can't figure it out, what's the point?\\n\\nSimplicity > Features"
    },
    "meta": {
      "timestamp": "4h"
    },
    "engagement": {
      "likes": 1234,
      "replies": 89,
      "reposts": 45
    }
  }
}
\`\`\`
`
  },

  {
    id: 'social-threads-reply',
    content: `
Threads reply:

\`\`\`social
{
  "platform": "threads",
  "data": {
    "author": {
      "name": "productpete",
      "avatar": "https://example.com/pete.jpg"
    },
    "content": {
      "text": "100% agree. We switched to Figma specifically because our PMs could actually make small edits themselves.\\n\\nSaved us hours of back-and-forth."
    },
    "meta": {
      "timestamp": "3h",
      "replyTo": "@designerdave"
    },
    "engagement": {
      "likes": 234,
      "replies": 12,
      "reposts": 8
    }
  }
}
\`\`\`
`
  },

  // ============================================================
  // SOCIAL ARTIFACTS - TikTok
  // ============================================================

  {
    id: 'social-tiktok-post',
    content: `
TikTok post preview:

\`\`\`social
{
  "platform": "tiktok",
  "data": {
    "author": {
      "name": "codingwithmia",
      "avatar": "https://example.com/mia.jpg",
      "verified": true
    },
    "content": {
      "text": "POV: You just discovered CSS Grid after years of using floats 😭 #coding #webdev #css #frontend #learntocode",
      "media": [
        { "url": "https://example.com/tiktok-thumb.jpg", "alt": "Video thumbnail" }
      ],
      "sound": "original sound - codingwithmia",
      "duration": "0:45"
    },
    "meta": {
      "timestamp": "2d"
    },
    "engagement": {
      "likes": 45000,
      "comments": 892,
      "shares": 2340,
      "views": 234000
    }
  }
}
\`\`\`
`
  },

  // ============================================================
  // SOCIAL ARTIFACTS - YouTube
  // ============================================================

  {
    id: 'social-youtube-video',
    content: `
YouTube video preview:

\`\`\`social
{
  "platform": "youtube",
  "data": {
    "author": {
      "name": "Fireship",
      "avatar": "https://example.com/fireship.jpg",
      "verified": true
    },
    "content": {
      "title": "AI just satisfies me in 100 seconds",
      "description": "Learn how AI is transforming software development in this quick explainer.",
      "media": [
        { "url": "https://example.com/youtube-thumb.jpg", "alt": "Video thumbnail" }
      ],
      "duration": "2:34"
    },
    "meta": {
      "timestamp": "3 weeks ago"
    },
    "engagement": {
      "views": 892000,
      "likes": 45000
    }
  }
}
\`\`\`
`
  },

  {
    id: 'social-youtube-short',
    content: `
YouTube Short preview:

\`\`\`social
{
  "platform": "youtube",
  "variant": "short",
  "data": {
    "author": {
      "name": "TechTips",
      "avatar": "https://example.com/techtips.jpg"
    },
    "content": {
      "title": "This VS Code trick will blow your mind 🤯",
      "media": [
        { "url": "https://example.com/short-thumb.jpg", "alt": "Short thumbnail" }
      ],
      "duration": "0:58"
    },
    "meta": {
      "timestamp": "5 days ago"
    },
    "engagement": {
      "views": 1200000,
      "likes": 89000
    }
  }
}
\`\`\`
`
  },

  // ============================================================
  // PANEL ARTIFACTS - Code Languages
  // ============================================================
  
  {
    id: 'code-html',
    content: `
Here's an HTML landing page:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Artifactuse Demo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: system-ui, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: white;
      padding: 3rem;
      border-radius: 1rem;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
      text-align: center;
      max-width: 400px;
    }
    h1 { color: #1a1a2e; margin-bottom: 1rem; }
    p { color: #4a5568; line-height: 1.6; }
    button {
      margin-top: 1.5rem;
      padding: 0.75rem 2rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      cursor: pointer;
      transition: transform 0.2s;
    }
    button:hover { transform: scale(1.05); }
  </style>
</head>
<body>
  <div class="card">
    <h1>Welcome to Artifactuse</h1>
    <p>Transform AI responses into interactive artifacts with live previews, forms, and rich media.</p>
    <button onclick="alert('Hello from Artifactuse!')">Get Started</button>
  </div>
</body>
</html>
\`\`\`
`
  },
  
  {
    id: 'code-vue',
    content: `
Here's a Vue 3 component:

\`\`\`vue
<template>
  <div class="counter-app">
    <h2>{{ title }}</h2>
    <div class="counter-display">{{ count }}</div>
    <div class="button-group">
      <button @click="decrement" :disabled="count <= 0">−</button>
      <button @click="reset">Reset</button>
      <button @click="increment">+</button>
    </div>
    <p class="message" v-if="count >= 10">🎉 You reached {{ count }}!</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  title: { type: String, default: 'Vue Counter' },
  initialValue: { type: Number, default: 0 }
})

const count = ref(props.initialValue)

const increment = () => count.value++
const decrement = () => count.value > 0 && count.value--
const reset = () => count.value = props.initialValue
</script>

<style scoped>
.counter-app {
  font-family: system-ui, sans-serif;
  padding: 2rem;
  text-align: center;
  background: #f8fafc;
  border-radius: 1rem;
}
.counter-display {
  font-size: 4rem;
  font-weight: bold;
  color: #3b82f6;
  margin: 1rem 0;
}
.button-group { display: flex; gap: 0.5rem; justify-content: center; }
button {
  padding: 0.75rem 1.5rem;
  font-size: 1.25rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  background: #3b82f6;
  color: white;
}
button:hover { background: #2563eb; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
.message { margin-top: 1rem; color: #10b981; font-weight: 500; }
</style>
\`\`\`
`
  },
  
  {
    id: 'code-jsx',
    content: `
Here's a React component:

\`\`\`jsx
import React, { useState } from 'react';

function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn Artifactuse', completed: true },
    { id: 2, text: 'Build something awesome', completed: false },
  ]);
  const [input, setInput] = useState('');

  const addTodo = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setTodos([...todos, { id: Date.now(), text: input, completed: false }]);
    setInput('');
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  return (
    <div style={{ fontFamily: 'system-ui', padding: '2rem', maxWidth: 400 }}>
      <h1>📝 Todo App</h1>
      
      <form onSubmit={addTodo} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a new task..."
          style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
        />
        <button type="submit" style={{ padding: '0.75rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem' }}>
          Add
        </button>
      </form>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {todos.map(todo => (
          <li key={todo.id} onClick={() => toggleTodo(todo.id)} style={{
            padding: '0.75rem',
            marginBottom: '0.5rem',
            background: todo.completed ? '#f0fdf4' : '#fef2f2',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            textDecoration: todo.completed ? 'line-through' : 'none'
          }}>
            {todo.completed ? '✅' : '⬜'} {todo.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoApp;
\`\`\`
`
  },

  {
    id: 'code-python',
    content: `
Here's a Python script:

\`\`\`python
import asyncio
from dataclasses import dataclass
from typing import Optional

@dataclass
class Artifact:
    """Represents a code artifact"""
    id: str
    language: str
    code: str
    title: Optional[str] = None

class ArtifactProcessor:
    """Process and transform code artifacts"""
    
    def __init__(self):
        self.artifacts: list[Artifact] = []
    
    async def process(self, code: str, language: str) -> Artifact:
        """Process a code block into an artifact"""
        artifact = Artifact(
            id=f"artifact-{len(self.artifacts)}",
            language=language,
            code=code,
            title=self._extract_title(code, language)
        )
        self.artifacts.append(artifact)
        return artifact
    
    def _extract_title(self, code: str, language: str) -> str:
        """Extract a title from the code"""
        if language == "python":
            for line in code.split("\\n"):
                if line.startswith("class "):
                    return line.split("(")[0].replace("class ", "")
                if line.startswith("def "):
                    return line.split("(")[0].replace("def ", "")
        return f"{language.title()} Code"

async def main():
    processor = ArtifactProcessor()
    
    artifact = await processor.process(
        code="def hello(): print('Hello!')",
        language="python"
    )
    
    print(f"Created artifact: {artifact.title}")

if __name__ == "__main__":
    asyncio.run(main())
\`\`\`
`
  },

  {
    id: 'code-bash',
    content: `
Here's a bash script:

\`\`\`bash
#!/bin/bash

# Artifactuse Deployment Script
# Deploy the SDK to production

set -e

echo "🚀 Starting Artifactuse deployment..."

# Configuration
PROJECT_DIR="/var/www/artifactuse"
BACKUP_DIR="/var/backups/artifactuse"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup
echo "📦 Creating backup..."
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" -C "$PROJECT_DIR" .

# Pull latest changes
echo "📥 Pulling latest changes..."
cd "$PROJECT_DIR"
git fetch origin main
git reset --hard origin/main

# Install dependencies
echo "📚 Installing dependencies..."
npm ci --production

# Build project
echo "🔨 Building project..."
npm run build

# Restart services
echo "🔄 Restarting services..."
pm2 restart artifactuse

# Health check
echo "🏥 Running health check..."
sleep 5
curl -f http://localhost:3000/health || exit 1

echo "✅ Deployment complete!"
\`\`\`
`
  },

  {
    id: 'code-sql',
    content: `
Here's a SQL schema:

\`\`\`sql
-- Artifactuse Database Schema
-- PostgreSQL 14+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artifacts table
CREATE TABLE artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    language VARCHAR(50),
    title VARCHAR(255),
    code TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_artifacts_user_id ON artifacts(user_id);
CREATE INDEX idx_artifacts_type ON artifacts(type);
CREATE INDEX idx_artifacts_created_at ON artifacts(created_at DESC);
\`\`\`
`
  },

  // ============================================================
  // MEDIA & EMBEDS
  // ============================================================

  {
    id: 'media-mixed',
    content: `
Here are some media embeds:

**YouTube Video:**
https://www.youtube.com/watch?v=dQw4w9WgXcQ

**Image:**
![Coding workspace](https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800)

**Google Map:**
https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.1!2d-73.98!3d40.75
`
  },

  // ============================================================
  // MATH & TABLES
  // ============================================================

  {
    id: 'content-math',
    content: `
Here are some mathematical formulas:

**Inline math:** The quadratic formula is \\(x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\\)

**Display math:**

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$
`
  },

  {
    id: 'content-table',
    content: `
Here's a comparison table:

| Feature          | Artifactuse | Competitor A | Competitor B |
|------------------|-------------|--------------|--------------|
| Live Preview     | ✅          | ✅           | ❌           |
| Form Generation  | ✅          | ❌           | ✅           |
| Social Previews  | ✅          | ❌           | ❌           |
| Canvas Editor    | ✅          | ❌           | ❌           |
| Video Timeline   | ✅          | ❌           | ❌           |
`
  },
  {
    id: 'images-canvas-artifactuse-ui-2',
    content: `
        I've curated a second set of visual inspirations that dive deeper into the **SaaS Dashboard** and **AI Interface** side of the **Artifactuse** brand. These samples show how the "Vibrant Purple" and "Hexagon" motifs can be scaled from a simple logo into a full-featured developer environment.

### Visual Mood Board: Part 2
This canvas highlights how to structure complex AI data using the minimalist, high-contrast style we've established.

\`\`\`canvas
{
  "width": 1200,
  "height": 900,
  "backgroundColor": "#0a0a0f",
  "shapes": [
    { "type": "text", "x": 600, "y": 50, "text": "ARTIFACTUSE: DASHBOARD & UI INSPIRATION", "fontSize": 32, "bold": true, "color": "#ffffff", "align": "center" },
    { "type": "frame", "name": "SaaS Dashboard", "x": 50, "y": 120, "width": 500, "height": 300, "children": [
        { "type": "image", "x": 50, "y": 120, "width": 500, "height": 300, "src": "https://cdn.dribbble.com/userupload/18350565/file/original-9e4dbb6e38b8ac5eac4089ecf1e2f1c5.png" }
    ]},
    { "type": "text", "x": 300, "y": 440, "text": "Concept: SaaS Component Management", "fontSize": 16, "color": "#6c5ce7", "align": "center" },
    { "type": "frame", "name": "AI Chat Kit", "x": 650, "y": 120, "width": 500, "height": 300, "children": [
        { "type": "image", "x": 650, "y": 120, "width": 500, "height": 300, "src": "https://images.ui8.net/uploads/preview-03_1760331192815.jpg" }
    ]},
    { "type": "text", "x": 900, "y": 440, "text": "Concept: Interactive Chat Artifacts", "fontSize": 16, "color": "#6c5ce7", "align": "center" },
    { "type": "rect", "x": 50, "y": 500, "width": 1100, "height": 300, "fillColor": "#1a1a2e", "cornerRadius": 15 },
    { "type": "text", "x": 600, "y": 540, "text": "UI DESIGN STRATEGY", "fontSize": 24, "bold": true, "color": "#ffffff", "align": "center" },
    { "type": "text", "x": 100, "y": 600, "text": "• HUD Backgrounds: Use glowing hexagonal patterns at 5-10% opacity for depth.\n• Card Layouts: Use the Charcoal (#2d3436) for containers to make purple text pop.\n• Data Viz: Use the Vibrant Purple (#6c5ce7) for active states and 'Action' buttons.\n• Connectivity: Use dashed lines to show relationships between AI nodes.", "fontSize": 18, "color": "#a0a0a0" },
    { "type": "path", "segments": [{ "point": [1050, 650] }, { "point": [1100, 680] }, { "point": [1100, 740] }, { "point": [1050, 770] }, { "point": [1000, 740] }, { "point": [1000, 680] }], "closed": true, "fillColor": "#6c5ce7", "opacity": 40 }
  ]
}
\`\`\`

### Key Inspiration Points:
*   **Futuristic HUDs:** The [Glowing Purple HUD Concept](https://c8.alamy.com/comp/2D554EM/futuristic-ui-design-glowing-purple-and-blue-hud-display-digital-concept-user-interface-high-technology-panel-hexagon-or-honeycomb-cyber-pattern-2D554EM.jpg) is perfect for the "Interaction Layer" background of your SDK, giving it a high-tech, "powered-on" feel.
*   **SaaS Dashboards:** The [AI Content Generator Dashboard](https://cdn.dribbble.com/userupload/18350565/file/original-9e4dbb6e38b8ac5eac4089ecf1e2f1c5.png) shows how to organize multiple "Artifacts" (like tables and images) in a clean, grid-based layout.
*   **AI Chat Kits:** The [Zyra Chat UI Kit](https://image.seapik.com/template/edit/20240229/sm/minimalistic-purple-dashboard-ui_3802.jpg) provides a great reference for how the "Answer → Action" workflow should look inside a messaging interface.
*   **Minimalist Templates:** The [Purple Dashboard Template](https://image.seapik.com/template/edit/20240229/sm/minimalistic-purple-dashboard-ui_3802.jpg) demonstrates how to use white space effectively to keep the developer experience (DX) focused and lightweight.

### How to proceed:
1.  **Landing Page Banner:** I can design a high-fidelity hero section using the "Glowing HUD" style as a background for your logo.
2.  **Video Intro:** We can animate these hexagonal patterns "booting up" to show the SDK initializing.
3.  **Component Mockups:** I can create \`canvas\` diagrams for specific artifact types (like the Video Editor or Data Table) using this purple/charcoal aesthetic.

Which of these would you like me to build for you first?
    `
  },
  {
    id: 'audio-music-sample',
    content: `
Here's a music sample you can listen to:

**Chill Coding Beats:**
https://www.example.com/audio/chill-coding-beats.mp3

## 4. If your skit is horror‑themed  
You can reuse one of these from earlier as a background bed or opening sting for the skit’s first moment:

- **Short horror atmosphere hit** – good for an instant “we’re in a horror scene” cue:  
  https://cdn.boostgpt.co/file/soundpen/sounds/bb0217b0-e74d-11ee-bb3f-3a769fbccfd7.mp3

- **Super scary horror film background sound** – loop quietly under dialogue for tension:  
  \`https://cdn.boostgpt.co/file/soundpen/sounds/bae73e9a-e74d-11ee-bb3f-3a769fbccfd7.mp3\`
`
  },
  {
    id: 'video-sample-clip',
    content: `
Here's a sample video clip:

**Amazing Nature Timelapse:**
http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4

HBO GO now works with Chromecast:
http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4

**YouTube Video:**
https://www.youtube.com/watch?v=dQw4w9WgXcQ
`
  },
    {
    id: 'form-feedback-survey',
    content: `
Quick feedback form:

\`\`\`form
{
  "title": "How was your experience?",
  "variant": "fields",
  "display": "inline",
  "data": {
    "fields": [
      { 
        "name": "rating", 
        "type": "radio", 
        "label": "Rating",
        "options": ["😍 Excellent", "😊 Good", "😐 Okay", "😕 Poor"],
        "required": true 
      },
      { 
        "name": "feedback", 
        "type": "textarea", 
        "label": "Tell us more (optional)",
        "placeholder": "What could we improve?",
        "rows": 2
      },
      {
        "type": "buttons",
        "fields": [
          { "type": "button", "label": "Skip", "action": "cancel", "variant": "ghost" },
          { "type": "button", "label": "Submit Feedback", "action": "submit", "variant": "primary" }
        ]
      }
    ]
  }
}
\`\`\`
`
  },
];

export default messages;