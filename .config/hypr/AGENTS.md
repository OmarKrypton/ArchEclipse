# Hyprland Configuration Guide for AI Coding Agents

## Overview
This is a **Hyprland window manager configuration** for CachyOS/Arch Linux systems. The configuration is split across multiple `.conf` files in the `config/` directory for better organization and maintainability.

**Current Version:** Hyprland v0.53.3

## Repository Structure
```
~/.config/hypr/
├── hyprland.conf              # Main config file (sources all others)
├── config/
│   ├── animations.conf        # Animation settings
│   ├── autostart.conf         # Auto-start applications
│   ├── colors.conf            # Color scheme definitions
│   ├── decorations.conf       # Window decorations and blur
│   ├── defaults.conf          # Default applications and tools
│   ├── environment.conf       # Environment variables
│   ├── input.conf             # Input device configuration
│   ├── keybinds.conf          # All keybindings
│   ├── monitor.conf           # Monitor/display settings
│   ├── variables.conf         # General variables and settings
│   └── windowrules.conf       # Window and workspace rules
└── AGENTS.md                  # This file
```

## Configuration Testing & Validation

### Check Configuration Syntax
```bash
# Test configuration without reloading
hyprctl configerrors

# Reload configuration
hyprctl reload
```

### Check Hyprland Version
```bash
hyprctl version
```

### Get Current Settings
```bash
# List all active binds
hyprctl binds

# List all monitors
hyprctl monitors

# List all workspaces
hyprctl workspaces

# Get specific keyword value
hyprctl getoption general:gaps_in
```

## Code Style Guidelines

### File Organization
- **Main config**: `hyprland.conf` only contains `source` statements and the `$mainMod` variable
- **Modular configs**: Each aspect (animations, keybinds, etc.) lives in its own file
- **Comments**: Use decorative headers with box-drawing characters for sections

### Comment Style
```conf
# ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
# ┃                    Section Name                             ┃
# ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

# Use single-line comments for inline documentation
```

### Keybindings Format
```conf
# Hyprland v0.53.3+ uses standard bind syntax with inline comments for descriptions
bind = MODS, KEY, dispatcher, params # Description of what this bind does

# Examples:
bind = $mainMod, RETURN, exec, $terminal # Opens your preferred terminal emulator
bind = $mainMod, Q, killactive, # Closes (not kill) current window
bind = $mainMod SHIFT, left, movewindow, l # Move active window to the left
```

**DEPRECATED (DO NOT USE):**
```conf
# The bindd variant with separate description parameter is deprecated
bindd = MODS, KEY, Description, dispatcher, params  # WRONG - Don't use this
```

### Environment Variables Format
```conf
# Use standard env keyword
env = VARIABLE,value

# Examples:
env = HYPRCURSOR_SIZE,24
env = XCURSOR_SIZE,24
```

**DEPRECATED (DO NOT USE):**
```conf
envd = VARIABLE,value  # WRONG - Don't use envd
```

### Variable Naming
- **Global variables**: Use `$lowercase` format (e.g., `$mainMod`, `$terminal`)
- **Color variables**: Use descriptive names (e.g., `$cachylgreen`, `$cachymblue`)
- **Application variables**: Use semantic names (e.g., `$filemanager`, `$applauncher`)

### Settings Organization
```conf
# Group related settings in blocks
category {
    setting1 = value
    setting2 = value
    
    # Sub-categories use nested blocks
    subcategory {
        subsetting = value
    }
}
```

### Spacing and Formatting
- Use **tabs** for indentation inside blocks (not spaces)
- One blank line between major sections
- Align `=` signs when it improves readability
- Keep inline comments aligned when listing similar items

## Hyprland-Specific Syntax

### Bindings
```conf
# Regular binds (press once)
bind = MODS, KEY, dispatcher, params

# Repeat binds (trigger on hold)
binde = MODS, KEY, dispatcher, params

# Locked binds (work even when screen is locked)
bindl = MODS, KEY, dispatcher, params

# Repeat and volume/brightness binds
bindel = MODS, KEY, dispatcher, params

# Mouse binds for dragging
bindm = MODS, MOUSE_BUTTON, dispatcher
```

### Common Modifiers
- `SUPER` or `$mainMod` - Windows/Super key
- `SHIFT`
- `CTRL`
- `ALT`
- Combine with spaces: `SUPER SHIFT`, `CTRL ALT`

### Common Dispatchers
- `exec` - Execute a command
- `killactive` - Close active window
- `togglefloating` - Toggle floating mode
- `fullscreen` - Toggle fullscreen
- `workspace` - Switch workspace
- `movetoworkspace` - Move window to workspace
- `movefocus` - Move focus between windows
- `movewindow` - Move window in direction
- `resizeactive` - Resize active window
- `togglegroup` - Toggle window grouping
- `pin` - Pin window to all workspaces

### Workspace Syntax
```conf
# Numbered workspaces: 1-10
workspace, 1

# Relative workspaces
workspace, e+1    # Next workspace
workspace, e-1    # Previous workspace
workspace, previous

# Special workspaces
workspace, special
workspace, special:scratchpad
```

### Window Rules
```conf
# v0.53.3+ uses a new syntax with match: selectors
windowrule = EFFECT VALUE, match:SELECTOR VALUE

# Examples:
windowrule = float on, match:class pavucontrol
windowrule = opacity 0.95, match:title QQ
windowrule = size 960 540, match:title Picture-in-Picture
```

**DEPRECATED (DO NOT USE):**
```conf
# Old v2 syntax - NO LONGER VALID
windowrulev2 = float, class:^(app)$  # WRONG - Don't use this
windowrule = float, class:^(app)$    # WRONG - Old syntax
```

### Animations
```conf
animations {
    enabled = yes
    bezier = NAME, X1, Y1, X2, Y2
    animation = TYPE, ENABLED, SPEED, CURVE, STYLE
}
```

## Common Modification Patterns

### Adding a New Keybinding
1. Open `config/keybinds.conf`
2. Find the relevant section (Window Actions, Workspace Actions, etc.)
3. Add the bind with inline comment:
```conf
bind = $mainMod, N, exec, application # Description of what this does
```

### Changing Default Applications
1. Open `config/defaults.conf`
2. Modify the variable:
```conf
$terminal = alacritty      # Change to your preferred terminal
$filemanager = thunar      # Change to your preferred file manager
$applauncher = wofi        # Change to your preferred launcher
```

### Adding Auto-Start Applications
1. Open `config/autostart.conf`
2. Add `exec-once` line:
```conf
exec-once = application &
```

### Modifying Window Rules
1. Find the window class or title:
```bash
hyprctl clients | grep -E "class|title"
```
2. Open `config/windowrules.conf`
3. Add rule using v0.53.3 syntax:
```conf
windowrule = float on, match:class your-app-class
windowrule = opacity 0.9, match:title Your Window Title
```

### Adjusting Gaps and Borders
1. Open `config/variables.conf`
2. Modify `general` block:
```conf
general {
    gaps_in = 3        # Inner gaps
    gaps_out = 5       # Outer gaps
    border_size = 3    # Border width
}
```

## Testing Changes

### Safe Testing Workflow
1. **Edit** the configuration file
2. **Validate** syntax:
   ```bash
   hyprctl configerrors
   ```
3. **Reload** configuration:
   ```bash
   hyprctl reload
   ```
4. **Test** the changes
5. If errors occur, check logs:
   ```bash
   journalctl --user -u hyprland -n 50
   ```

### Quick Config Reload
You can bind a reload key in `keybinds.conf`:
```conf
bind = $mainMod SHIFT, R, exec, hyprctl reload # Reload Hyprland config
```

## Important Notes for AI Agents

### Breaking Changes in v0.53.3
- **`bindd` is deprecated** - Use `bind` with inline comments instead
- **`envd` is deprecated** - Use `env` instead
- **`windowrule` and `windowrulev2` syntax completely changed** - Now uses `match:selector` format
- **Layer rules syntax changed** - Now uses `match:namespace` format
- All configurations in this repository have been updated to v0.53.3 syntax

### Best Practices
1. **Always use inline comments** for keybind descriptions (not the old `bindd` format)
2. **Test after each change** using `hyprctl reload`
3. **Check for errors** with `hyprctl configerrors`
4. **Preserve the modular structure** - edit the appropriate config file, not hyprland.conf
5. **Use variables** for repeated values (colors, applications, etc.)
6. **Follow existing naming conventions** for consistency

### Common Pitfalls
- Don't use quotes around dispatcher parameters unless needed for spacing
- Remember the comma separator: `bind = MOD, KEY, dispatcher, params`
- Workspace numbers are 1-indexed, not 0-indexed (except for workspace 10 which uses key `0`)
- Window class regex requires `^` and `$` anchors: `class:^(exact-match)$`
- Mouse buttons use `mouse:272` (LMB), `mouse:273` (RMB), etc.

## References
- [Official Hyprland Wiki](https://wiki.hyprland.org/)
- [Configuring Binds](https://wiki.hyprland.org/Configuring/Binds/)
- [Configuring Variables](https://wiki.hyprland.org/Configuring/Variables/)
- [Window Rules](https://wiki.hyprland.org/Configuring/Window-Rules/)
- [Dispatchers](https://wiki.hyprland.org/Configuring/Dispatchers/)
