/**
 * Copyright (c) 2012 Derrell Lipman
 * 
 * License:
 *   LGPL: http://www.gnu.org/licenses/lgpl.html 
 *   EPL : http://www.eclipse.org/org/documents/epl-v10.php
 */

/*
#ignore(Blockly)
#ignore(Blockly.features)
#ignore(Blockly.Toolbox)
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
   */
  construct : function() 
  {
    var             blocklyLoader;
    var             vBox;

    // We will have two parts: a toolbox and the block editor, arranged
    // horizontally.
    this.base(arguments, new qx.ui.layout.HBox());
    
    // Start loading all of the Blockly files
    blocklyLoader = blockly.BlocklyLoader.getInstance();
    
    // Await notification of completion
    blocklyLoader.addListener("done", this._startBlockly, this);

    vBox = new qx.ui.container.Composite(new qx.ui.layout.VBox());
    vBox.set(
      {
        width : 200
      });
    this.add(vBox);

    this.tree = new qx.ui.tree.VirtualTree(null, "name", "children");
    this.tree.set(
      {
        font : qx.theme.manager.Font.getInstance().resolve("default"),
        hideRoot : true,
        showTopLevelOpenCloseIcons : true
      });

    vBox.add(this.tree, { flex : 1 });
    
    this.editor = new qx.ui.core.Widget();
    this.editor.set(
      {
        width  : 1000,
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
      var             nodes;
      var             root;
      var             parent;
      var             prefixLength;
      var             category;
      var             categoryList;
      var             categoryDecoded;
      var             nodeTree;

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

        // Do not display the SVG toolbox. We have our own.
        Blockly.features.disableSvgToolbox = true;
        
        // Now start up Blockly.
        Blockly.inject(this.editor.getContentElement().getDomElement());
        
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
                parent = parent.children[nodeName];
              }
            },
            this);
        }

        // converts the raw nodes to qooxdoo objects
        nodes = qx.data.marshal.Json.createModel(nodes, true);

        // Create a listener for when the selection changes
        this.tree.getSelection().addListener(
          "change",
          function(e)
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
              // Nope. Deselect it. (Doesn't work if not delayed a bit.)
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
          this);

        this.tree.setModel(nodes.getItem(0));
      }
    }
  }
});
