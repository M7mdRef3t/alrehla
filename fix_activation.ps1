
$content = Get-Content "app\activation\page.tsx" -Raw -Encoding utf8

# Find the start of corruption (where "amoun" truncates "amountPlaceholder")
$badStart = "      amoun    return ("

# Find the correct end after the corruption - we need to find "); }" then "  return ("
# The end of the bad block is `);` followed by the `if (!ACTIVATION_PUBLIC_ENABLED)` block closing `}`
# Then the final return statement

# Let's find what comes AFTER the whole messed up disabled section
$goodContinuation = "  return (`r`n    <main className=`"min-h-screen bg-[#030712]"

# Find position
$corruptStart = $content.IndexOf($badStart)
Write-Host "Corruption starts at: $corruptStart"

# Find the correct continuation point (the final return statement)
$goodStart = $content.IndexOf("  return (" + [char]13 + [char]10 + "    <main className=`"min-h-screen bg-[#030712]")
Write-Host "Good continuation at: $goodStart"
