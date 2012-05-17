/**
 * Copyright (c) 2012 Derrell Lipman
 * 
 * License:
 *   LGPL: http://www.gnu.org/licenses/lgpl.html 
 *   EPL : http://www.eclipse.org/org/documents/epl-v10.php
 */

/*
#ignore(Blockly)
#ignore(Blockly.Trashcan.prototype)
 */

/**
 * This is the main application class of your custom application "Blockly"
 * 
 */
qx.Class.define("blockly.Blockly",
{
  extend : qx.ui.container.Composite,

  /**
   * Create the Blockly widget
   */
  construct : function() 
  {
    // We will have two parts: a toolbox and the block editor, arranged
    // horizontally.
    this.base(arguments, new qx.ui.layout.HBox());
    
    // Start loading all of the Blockly files
    var blocklyLoader = blockly.BlocklyLoader.getInstance();
    
    // Await notification of completion
    blocklyLoader.addListener("done", this._startBlockly, this);

    var vBox = new qx.ui.container.Composite(new qx.ui.layout.VBox());
    vBox.set(
      {
        width : 140
      });
    this.add(vBox);

    // Only one panel should be open at a time, in each group.
    var outerGroup = new qx.ui.form.RadioGroup();
    outerGroup.setAllowEmptySelection(true);
    var innerGroup = new qx.ui.form.RadioGroup();
    innerGroup.setAllowEmptySelection(true);

    var outer;
    var inner;
    outer = new collapsablepanel.Panel("Hello world");
    outer.set(
      {
        group         : outerGroup,
        showSeparator : false,
        layout        : new qx.ui.layout.VBox()
      });
    inner = new collapsablepanel.Panel("Colors");
    inner.set(
      {
        group         : innerGroup,
        showSeparator : false,
        layout        : new qx.ui.layout.VBox()
      });
    inner.add(new qx.ui.basic.Label("Red"));
    inner.add(new qx.ui.basic.Label("Green"));
    inner.add(new qx.ui.basic.Label("Blue"));
    outer.add(inner);
    vBox.add(outer);

    outer = new collapsablepanel.Panel("Hi there");
    outer.set(
      {
        group         : outerGroup,
        showSeparator : false
      });
    vBox.add(outer);

    outer = new collapsablepanel.Panel("See ya!");
    outer.set(
      {
        group         : outerGroup,
        showSeparator : false
      });
    vBox.add(outer);
    
    this.editor = new qx.ui.core.Widget();
    this.editor.set(
      {
        width  : 1000,
//        height : 600,
        appearance : "table"
      });
    this.add(this.editor);
    
    // When all of this has appeared, see if we can start Blockly
    this.addListener(
      "appear",
      function(e)
      {
        this._startBlockly(null);
      },
      this);
    
    // We're waiting for two events: appear and blockly loaded
    this.__eventsPending = 2;
  },
  
  members :
  {
    __eventsPending : 0,

    _startBlockly : function(e)
    {
      // Was this a "done" event from the Blockly loader?
      if (e)
      {
        // Yup. Get the data and ensure it succeeded
        if (e.getData().status != "success")
        {
          throw new Error("Failed to load files:\n\t" + 
                          e.getData().failures.join("\n\t"));
        }
      }

      // We got an event. Decrement the counter
      --this.__eventsPending;
      
      // Have we received all that we expect?
      if (this.__eventsPending == 0)
      {
        // Yup. Start up Blockly. First, make some path changes.
        Blockly.makeFilename = function(name)
        {
          return qx.util.ResourceManager.getInstance().toUri(
            "upstream/" + name);
        };
        Blockly.Trashcan.prototype.BODY_URL_ =
          qx.util.ResourceManager.getInstance().toUri(
            "upstream/media/trashbody.png");
        Blockly.Trashcan.prototype.LID_URL_ =
          qx.util.ResourceManager.getInstance().toUri(
            "upstream/media/trashlid.png");

        
        // Now start up Blockly.
        Blockly.inject(this.editor.getContentElement().getDomElement());
      }
    }
  }
});
