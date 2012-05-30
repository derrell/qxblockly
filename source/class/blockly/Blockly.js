/**
 * Copyright (c) 2012 Derrell Lipman
 * 
 * License:
 *   LGPL: http://www.gnu.org/licenses/lgpl.html 
 */

/*
#ignore(Blockly)
#ignore(Blockly.features)
#ignore(Blockly.Xml)
#ignore(Blockly.Connection.prototype)
#ignore(Blockly.Toolbox)
#ignore(Blockly.Generator)
#ignore(Blockly.Toolbox.PREFIX_)
#ignore(Blockly.Toolbox.flyout_)
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
   *
   * @param blocks {Map}
   *   Map, where each key is a member added to Blockly.Language, and the
   *   value is itself a map, in the format required by Blockly.Language. In
   *   addition to those elements of the map required by Blockly, there may
   *   (should) also be a <i>generators</i> map which contains one member for
   *   each output language supported. The value of that that member should be
   *   the function for generating code in that language.
   *
   * @param fPublish {Function}
   *   Function which is to be called for each significant event in Blockly
   *   operation: addition of blocks to the workspace, block movement, block
   *   connection, etc. The function is called with two parameters: a message
   *   (Map), and a message type (String).
   */
  construct : function(blocks, fPublish)
  {
    var             blocklyLoader;
    var             vBox;

    // We will have two parts: a toolbox and the block editor, arranged
    // horizontally.
    this.base(arguments, new qx.ui.layout.HBox());
    
    // Save the publish function to assign after Blockly is loaded
    this.__fPublish = fPublish;

    // Start loading all of the Blockly files, and then language blocks when
    // Blockly files are fully loaded.
    blocklyLoader = new blockly.BlocklyLoader(blocks);
    
    // Await notification of completion
    blocklyLoader.addListener("done", this._startBlockly, this);

    vBox = new qx.ui.container.Composite(new qx.ui.layout.VBox());
    vBox.set(
      {
        width : 140
      });
    this.add(vBox);

    this.tree = new qx.ui.tree.VirtualTree(null, "name", "children");
    this.tree.set(
      {
        font : qx.theme.manager.Font.getInstance().resolve("default"),
        hideRoot : true,
        showTopLevelOpenCloseIcons : true,
        delegate :
        {
          configureItem : function(item)
          {
            // Use small (16px) icons instead of the standard (22px) ones.
            item.addState("small");
          }
        }
      });

    vBox.add(this.tree, { flex : 1 });
    
    this.editor = new qx.ui.core.Widget();
    this.editor.set(
      {
        appearance : "table"
      });
    this.add(this.editor, { flex : 1 });
    
    // When all of this has appeared, see if we can start Blockly
    this.addListenerOnce(
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

    __language : null,

    /**
     * Called when all Blockly files have been loaded, and when the user
     * interface has received its "appear" event. Once both of these have
     * occurred, Blockly is initialized.
     * 
     * @param e {qx.event.type.Data?}
     *   When present, this is the data from the Blockly loader, which
     *   contains a 'status' member with value "success" if all files were
     *   loaded properly, and some other value otherwise.
     */
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
        // Yup. Blockly is ready
        this._lockedAndLoaded();
      }
    },
    
    /**
     * Called when Blockly is fully loaded and we've received the "appear"
     * event on the user interface.
     */
    _lockedAndLoaded : function()
    {
      var             _this = this;
      var             nodes;
      var             root;
      var             parent;
      var             prefixLength;
      var             category;
      var             categoryList;
      var             categoryDecoded;
      var             nodeTree;
      var             block;
      var             blockName;
      var             language;

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

      // Do not display the SVG toolbox. We have our own.
      Blockly.features.disableSvgToolbox = true;

      // For now, our publish function is a debugging one
      Blockly.publish = this.__fPublish;

      // Now start up Blockly.
      Blockly.inject(this.editor.getContentElement().getDomElement());

      // Resize the blocks editor when its container resizes.
      this.editor.addListener(
        "resize",
        function(e)
        {
          // Delay momentarily, so container size has actually changed
          qx.util.TimerManager.getInstance().start(
            function(e)
            {
              Blockly.fireUiEvent(Blockly.svgDoc, window, 'resize');
            });
        },
        this);

      // Override the toolbox's clearSelection method to remove the
      // selection from our tree instead of from the SVG (internal) tree.
      Blockly.Toolbox.clearSelection = qx.lang.Function.bind(
        function()
        {
          Blockly.Toolbox.flyout_.hide();
          this.tree.getSelection().removeAll();
        },
        this);

      // Populate the toolbox tree
      nodes = [];

      // The root node is not shown
      nodes[0] = 
        {
          name     : "<root>",
          children : []
        };

      root = nodes[0];
      prefixLength = Blockly.Toolbox.PREFIX_.length;

      // Initialize the node tree
      nodeTree = 
        {
          "<root>" : 
          {
            node     : nodes[0],
            children : {}
          }
        };

      for (category in Blockly.Toolbox.languageTree)
      {
        categoryDecoded = window.decodeURI(category.substring(prefixLength));
        categoryList = categoryDecoded.split("\0");

        // Start at the root, in search of the specified hierarchy
        parent = nodeTree["<root>"];

        categoryList.forEach(
          function(nodeName, i)
          {
            var             node; 

            // Add this name and its node reference to the name hierarchy.
            // Does a node for this name hierarchy already exist? If so,
            // there's nothing for us to do.
            if (! parent.children[nodeName])
            {
              // This node does not already exist. Create the new node for
              // the data model.
              node =
                {
                  name     : nodeName
                };

              // Is this a leaf node?
              if (i == categoryList.length - 1)
              {
                // Yup. Add the category.
                node.category = category;
              }
              else
              {
                // It's a branch node. Add a children array.
                node.children = [];
              }

              // Add this new node.
              parent.node.children.push(node);

              // Keep track of the hierarchy in an efficient fashion, and
              // advance to the new child node.
              parent = parent.children[nodeName] =
                {
                  node     : node,
                  children : []
                };
            }
            else
            {
              // This node already exists. Just move on to the next one.
              parent = parent.children[nodeName];
            }
          },
          this);
      }

      // Convert the raw nodes to qooxdoo objects
      nodes = qx.data.marshal.Json.createModel(nodes, true);

      // Create a listener for when the selection changes
      this.tree.getSelection().addListener(
        "change", this._onSelectionChange, this);

      // Render this model in the tree
      this.tree.setModel(nodes.getItem(0));
    },

    /**
     * Event handler for a change of selection on the toolbox tree
     */
    _onSelectionChange : function()
    {
      var             selection;
      var             category;

      // Retrieve the selection
      selection = this.tree.getSelection();

      // See if anything is selected
      if (selection.getLength() === 0)
      {
        // Nope, nothing is selected, so we have nothing to do
        return;
      }

      // Hide any previous flyout that may still be visible
      Blockly.Toolbox.flyout_.hide();

      // Is this a leaf node with a category?
      if (! selection.getItem(0).getCategory)
      {
        // Nope. Deselect it. (Requires a delay to be functional.)
        qx.util.TimerManager.getInstance().start(
          function()
          {
            selection.removeAll();
          },
          0,
          this,
          null,
          10);

        // No more to do.
        return;
      }

      // Get the category of the selected item
      category = selection.getItem(0).getCategory();

      // Display the flyout associated with the selected category.
      var blockSet = Blockly.Toolbox.languageTree[category] || category;
      Blockly.Toolbox.flyout_.show(blockSet);
    },

    /**
     * Convert the current blocks program into JavaScript code.
     * 
     * @return {String}
     *   The JavaScript representation of the current blocks program.
     */
    toJavaScript : function()
    {
      return Blockly.Generator.workspaceToCode('JavaScript');      
    }
  }
});
