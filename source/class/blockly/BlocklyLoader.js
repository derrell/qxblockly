/**
 * Copyright (c) 2012 Derrell Lipman
 * 
 * License:
 *   LGPL: http://www.gnu.org/licenses/lgpl.html 
 */

/*
#asset(upstream/*)
#ignore(Blockly)
#ignore(Blockly.Generator)
*/

/**
 * Wrapper around Google Blockly. This class loads Blockly.
 */
qx.Class.define("blockly.BlocklyLoader",
{
  extend : scriptlistloader.Loader,

  /**
   * Load Blockly.
   * 
   * @param blocks {Map?}
   *   Map, where each key is a member added to Blockly.Language, and the
   *   value is itself a map, in the format required by Blockly.Language. In
   *   addition to those elements of the map required by Blockly, there may
   *   (should) also be a <i>generators</i> map which contains one member for
   *   each output language supported. The value of that that member should be
   *   the function for generating code in that language.
   */
  construct : function(blocks)
  {
    var             jsFiles = null;
    var             cssFiles = null;

    // Save the blocks map so it can be added after Blockly is loaded
    this.__blocks = blocks || {};

    // List the JavaScript files to be included
    jsFiles =
      [
        "blockly.js",
        "block.js",
        "block_svg.js",
        "comment.js",
        "connection.js",
        "contextmenu.js",
        "field.js",
        "field_dropdown.js",
        "field_label.js",
        "field_textinput.js",
        "flyout.js",
        "generator.js",
        "inject.js",
        "language/dart.js",
        "language/dart_control.js",
        "language/dart_text.js",
        "language/dart_math.js",
        "language/dart_logic.js",
        "language/dart_lists.js",
        "language/dart_variables.js",
        "language/javascript.js",
        "language/javascript_control.js",
        "language/javascript_text.js",
        "language/javascript_math.js",
        "language/javascript_logic.js",
        "language/javascript_lists.js",
        "language/javascript_variables.js",
//        "language/javascript_qxmobileui.js",
        "language/language_control.js",
        "language/language_text.js",
        "language/language_math.js",
        "language/language_logic.js",
        "language/language_lists.js",
        "language/language_variables.js",
//        "language/language_qxmobileui.js",
        "mutator.js",
        "scrollbar.js",
        "toolbox.js",
        "tooltip.js",
        "trashcan.js",
        "variables.js",
        "workspace.js",
        "xml.js"
      ];
    
    // List the CSS files to be included
    cssFiles =
      [
        "blockly.css"
      ];

    this.base(arguments,
              qx.lang.Function.bind(this._onLoaded, this),
              "upstream",
              jsFiles,
              cssFiles);
  },

  events :
  {
    /** Fired when all scripts have been loaded */
    "done" : "qx.event.type.Data"
  },

  members :
  {
    /**
     * Called when all files have been processed.
     * 
     * @param failures {Array}
     *   List of files which could not be loaded.
     */
    _onLoaded : function(failures)
    {
      // Ensure that all files loaded properly
      if (failures.length > 0)
      {
        // Let listeners know we're fully loaded
        this.fireDataEvent(
          "done",
          {
            status   : "fail",
            failures : failures
          });
      }
      else
      {
        // Were any languages loaded along with Blockly?
        if (! Blockly.Language)
        {
          // Nope. Initialize the language map.
          Blockly.Language = {};
        }

        // Load any language blocks we were given
        this._addLanguageBlocks(this.__blocks);

        // Let listeners know we're fully loaded
        this.fireDataEvent(
          "done",
          {
            status : "success"
          });
      }
    },
    
    /**
     * Add a set of language block definitions.
     * 
     * @param blocks {Map}
     *   Map, where each key is a member added to Blockly.Language, and the
     *   value is itself a map, in the format required by Blockly.Language. In
     *   addition to those elements of the map required by Blockly, there may
     *   (should) also be a <i>generators</i> map which contains one member for
     *   each output language supported. The value of that that member should be
     *   the function for generating code in that language.
     */
    _addLanguageBlocks : function(blocks)
    {
      var             block;
      var             blockName;
      var             language;

      // Add the provided language components
      for (blockName in blocks)
      {
        // Reference the block to be saved
        block = blocks[blockName];

        // Save this block description
        Blockly.Language[blockName] = block;
        
        // If there's a map of output language generation functions...
        if (block.generators)
        {
          for (language in block.generators)
          {
            // Create or retrieve this language's map from within Blockly
            Blockly[language] = Blockly.Generator.get(language);
            
            // Save the language generator for this language, for this block
            Blockly[language][blockName] = block.generators[language];
          }
        }
      }
    }
  }
});
