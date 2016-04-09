cat copyright_header.txt <(browserify index.js --standalone tenuki) > build/tenuki.js
cat copyright_header.txt css/*.css > build/tenuki.css
