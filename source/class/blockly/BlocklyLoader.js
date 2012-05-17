/**
 * Copyright (c) 2012 Derrell Lipman
 * 
 * License:
 *   LGPL: http://www.gnu.org/licenses/lgpl.html 
 *   EPL : http://www.eclipse.org/org/documents/epl-v10.php
 */

/*
#asset(upstream/*)
#ignore(Blockly)
*/

/**
 * Wrapper around Google Blockly. This class loads Blockly.
 */
qx.Class.define("blockly.BlocklyLoader",
{
  extend : scriptlistloader.Loader,
  type   : "singleton",

  construct : function()
  {
    var             jsFiles = null;
    var             cssFiles = null;

    // List the JavaScript files to be included
    jsFiles =
      [
        "blockly.js",
        "block.js",
        "blockSvg.js",
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
        "language/javascript_qxmobileui.js",
        "language/language_control.js",
        "language/language_text.js",
        "language/language_math.js",
        "language/language_logic.js",
        "language/language_lists.js",
        "language/language_variables.js",
        "language/language_qxmobileui.js",
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
        // Let listeners know we're fully loaded
        this.fireDataEvent(
          "done",
          {
            status : "success"
          });
      }
    }
  }
});
