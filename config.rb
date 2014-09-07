css_dir         = "src/stylesheets"
sass_dir        = "src/sass"
output_style    = (environment == :production) ? :compressed : :expanded
relative_assets = true
line_comments   = (environment == :production) ? :false : :true
