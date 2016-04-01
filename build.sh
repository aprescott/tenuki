cat copyright_header.txt <(browserify index.js --standalone tenuki) > build/tenuki.js
cat css/*.css > build/tenuki.css
