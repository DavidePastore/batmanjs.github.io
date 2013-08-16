// Generated by CoffeeScript 1.6.3
(function() {
  var _ref, _ref1, _ref2, _ref3, _ref4, _ref5,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  $('<script src="lib/dist/batman.jquery.js"></script>').appendTo('head');

  $('<script src="lib/extras/batman.rails.js"></script>').appendTo('head');

  $('<script src="js/codemirror.js"></script>').appendTo('head');

  $('<script src="js/modes/coffeescript.js"></script>').appendTo('head');

  $('<script src="js/modes/ruby.js"></script>').appendTo('head');

  $('<link rel="stylesheet" href="css/codemirror.css" />').appendTo('head');

  $('<link rel="stylesheet" href="css/solarized.css" />').appendTo('head');

  window.Try = (function(_super) {
    __extends(Try, _super);

    function Try() {
      _ref = Try.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Try.dispatcher = false;

    Try.navigator = false;

    Try.layout = 'layout';

    Try.previewApp = function() {
      var _this = this;
      if (this.previewWindow) {
        return this.previewWindow.focus();
      } else {
        this.previewWindow = window.open('http://localhost:3000/?preview=true', "app_preview", "width=400,height=600");
        return window.addEventListener('message', function(event) {
          if (event.data !== 'previewReady') {
            return;
          }
          _this.sendPreviewData();
          console.log('running');
          return _this.previewWindow.postMessage('run', '*');
        }, false);
      }
    };

    Try.sendPreviewData = function() {
      this.sendPreviewFile('rdio.js.coffee');
      this.sendPreviewDirectory('lib');
      this.sendPreviewDirectory('controllers');
      this.sendPreviewDirectory('models');
      this.sendPreviewDirectory('views');
      return this.sendPreviewDirectory('html');
    };

    Try.sendPreviewDirectory = function(dir) {
      var _this = this;
      if (typeof dir === 'string') {
        dir = Try.File.findByPath("/app/assets/batman/" + dir);
      }
      return dir.get('childFiles').forEach(function(file) {
        return _this.sendPreviewFile(file);
      });
    };

    Try.sendPreviewFile = function(file) {
      if (typeof file === 'string') {
        file = Try.File.findByPath("/app/assets/batman/" + file);
      }
      return this.previewWindow.postMessage({
        file: file.toJSON()
      }, '*');
    };

    Try.reloadPreview = function() {
      if (!this.previewWindow) {
        return;
      }
      return this.previewWindow.postMessage('reload', '*');
    };

    return Try;

  })(Batman.App);

  Try.LayoutView = (function(_super) {
    __extends(LayoutView, _super);

    function LayoutView(options) {
      options.node = $('.intro')[0];
      LayoutView.__super__.constructor.apply(this, arguments);
    }

    LayoutView.prototype.showFile = function(file) {
      if (file.get('isDirectory')) {
        return file.set('isExpanded', !file.get('isExpanded'));
      } else {
        return file.show();
      }
    };

    LayoutView.prototype.nextStep = function() {
      var index, step;
      Try.currentStep.complete();
      return;
      index = Try.steps.indexOf(Try.currentStep);
      step = Try.steps[index + 1];
      return step != null ? step.activate() : void 0;
    };

    return LayoutView;

  })(Batman.View);

  Try.File = (function(_super) {
    __extends(File, _super);

    function File() {
      _ref1 = File.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    File.storageKey = 'app_files';

    File.resourceName = 'app_files';

    File.persist(Batman.RailsStorage);

    File.findByName = function(name) {
      return this.get('loaded.indexedBy.name').get(name).get('first');
    };

    File.findByPath = function(name) {
      return this.get('loaded.indexedBy.id').get(name).get('first');
    };

    File.classAccessor('topLevel', function() {
      return Try.File.get('all').filter(function(file) {
        return !file.get('parent');
      });
    });

    File.accessor('childFiles', function() {
      var files;
      files = new Batman.Set;
      this.get('children').forEach(function(child) {
        if (child.get('isDirectory')) {
          return files.add.apply(files, child.get('childFiles')._storage);
        } else {
          return files.add(child);
        }
      });
      return files;
    });

    File.encode('name', 'content', 'isDirectory', 'id');

    File.encode('children', {
      decode: function(kids) {
        var file, kid, set, _i, _len;
        set = new Batman.Set;
        for (_i = 0, _len = kids.length; _i < _len; _i++) {
          kid = kids[_i];
          file = Try.File.createFromJSON(kid);
          file.set('parent', this);
          set.add(file);
        }
        return set;
      }
    });

    File.encode('expectations', {
      decode: function(expectations, key, data) {
        var expectation, _i, _len;
        for (_i = 0, _len = expectations.length; _i < _len; _i++) {
          expectation = expectations[_i];
          Try.namedSteps[expectation.stepName].expect(data.id, new RegExp(expectation.regex), expectation.completion);
        }
        return null;
      }
    });

    File.prototype.isExpanded = false;

    File.prototype.show = function() {
      return Try.set('currentFile', this);
    };

    return File;

  })(Batman.Model);

  Try.CodeView = (function(_super) {
    __extends(CodeView, _super);

    function CodeView() {
      this.save = __bind(this.save, this);
      _ref2 = CodeView.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    CodeView.prototype.docForFile = function(file) {
      var doc, filename, mode;
      filename = file.get('id');
      this.docs || (this.docs = {});
      if (!(doc = this.docs[filename])) {
        mode = filename.indexOf('.coffee') !== -1 ? 'coffeescript' : 'ruby';
        doc = this.docs[filename] = CodeMirror.Doc(file.get('content'), mode);
        file.observe('content', function(value) {
          return doc.setValue(value);
        });
      }
      return doc;
    };

    CodeView.prototype.ready = function() {
      var keys, node,
        _this = this;
      keys = {
        'Cmd-S': this.save
      };
      node = this.get('node');
      this.cm = CodeMirror(node, {
        theme: 'solarized',
        lineNumbers: true,
        extraKeys: keys
      });
      this.cm.getWrapperElement().style.height = "100%";
      Try.observeAndFire('currentFile', function(file) {
        if (file) {
          return _this.cm.swapDoc(_this.docForFile(file));
        }
      });
      return setTimeout(function() {
        return _this.cm.refresh();
      }, 0);
    };

    CodeView.prototype.save = function() {
      Try.set('currentFile.content', this.cm.getValue());
      Try.reloadPreview();
      return Try.fire('fileSaved', Try.get('currentFile'));
    };

    return CodeView;

  })(Batman.View);

  Try.FileView = (function(_super) {
    __extends(FileView, _super);

    function FileView() {
      _ref3 = FileView.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    FileView.prototype.html = "<a data-bind=\"file.name\" data-event-click=\"showFile | withArguments file\" class=\"file\" data-addclass-directory=\"file.isDirectory\" data-addclass-active=\"currentFile | equals file\" data-addclass-expanded=\"file.isExpanded\"></a>\n<ul data-showif=\"file.isDirectory | and file.isExpanded\" data-renderif=\"file.isDirectory\">\n  <li data-foreach-file=\"file.children\">\n    <div data-view=\"FileView\"></div>\n  </li>\n</ul>";

    return FileView;

  })(Batman.View);

  Try.Step = (function(_super) {
    __extends(Step, _super);

    Step.prototype.hasNext = true;

    function Step(name) {
      this.name = name;
      this.body = new Batman.Set;
      Try.namedSteps[name] = this;
      Try.steps.push(this);
    }

    Step.prototype.activate = function() {
      return Try.set('currentStep', this);
    };

    Step.prototype.title = function(string) {
      return this.set('heading', string);
    };

    Step.prototype.say = function(string) {
      return this.get('body').add(string);
    };

    Step.prototype.after = function(string) {
      return this.after = string;
    };

    return Step;

  })(Batman.Object);

  Try.ConsoleStep = (function(_super) {
    __extends(ConsoleStep, _super);

    function ConsoleStep() {
      _ref4 = ConsoleStep.__super__.constructor.apply(this, arguments);
      return _ref4;
    }

    ConsoleStep.prototype.isConsole = true;

    ConsoleStep.prototype.activate = function() {
      ConsoleStep.__super__.activate.apply(this, arguments);
      return $('#terminal-field').focus();
    };

    ConsoleStep.prototype.expect = function(regex) {
      this.regex = regex;
    };

    return ConsoleStep;

  })(Try.Step);

  Try.CodeStep = (function(_super) {
    __extends(CodeStep, _super);

    function CodeStep() {
      _ref5 = CodeStep.__super__.constructor.apply(this, arguments);
      return _ref5;
    }

    CodeStep.prototype.isCode = true;

    CodeStep.prototype.activate = function() {
      var file, filename;
      if (filename = this.focusFile) {
        file = Try.File.findByPath(filename);
        Try.layout.showFile(file);
      }
      return CodeStep.__super__.activate.apply(this, arguments);
    };

    CodeStep.prototype.expect = function(filename, regex, completion) {
      var _base;
      this.matches || (this.matches = {});
      return ((_base = this.matches)[filename] || (_base[filename] = [])).push({
        regex: regex,
        completion: completion
      });
    };

    CodeStep.prototype.focus = function(filename) {
      return this.focusFile = filename;
    };

    CodeStep.prototype.complete = function() {
      var completion, file, filename, match, matches, newString, value, _i, _len, _ref6;
      if (this.isComplete) {
        return;
      }
      _ref6 = this.matches;
      for (filename in _ref6) {
        matches = _ref6[filename];
        file = Try.File.findByPath(filename);
        for (_i = 0, _len = matches.length; _i < _len; _i++) {
          match = matches[_i];
          value = file.get('content');
          if (!match.regex.test(value)) {
            completion = match.completion;
            newString = value.substr(0, completion.index);
            newString += completion.value;
            newString += value.substr(completion.index);
            file.set('content', newString);
          }
        }
      }
      return this.isComplete = true;
    };

    return CodeStep;

  })(Try.Step);

  Try.Tutorial = (function() {
    function Tutorial() {
      var _this = this;
      Try.steps = [];
      Try.namedSteps = {};
      Try.on('fileSaved', function(file) {
        var match, matches, value, _i, _len;
        if (matches = Try.currentStep.matches[file.get('id')]) {
          value = file.get('content');
          for (_i = 0, _len = matches.length; _i < _len; _i++) {
            match = matches[_i];
            if (!match.regex.test(value)) {
              return;
            }
          }
        }
        console.log('matched!');
        return Try.currentStep.isComplete = true;
      });
    }

    Tutorial.prototype.c = function(name, block) {
      var step;
      step = new Try.CodeStep(name);
      if (block != null) {
        block.call(step);
      }
      return step;
    };

    Tutorial.prototype.$ = function(name, block) {
      var step;
      step = new Try.ConsoleStep(name);
      if (block != null) {
        block.call(step);
      }
      return step;
    };

    return Tutorial;

  })();

  $.ajax({
    url: 'tutorial.js',
    dataType: 'text',
    success: function(content) {
      eval("with(new Try.Tutorial){" + content + "}");
      return Try.File.load(function() {
        Try.run();
        Try.steps[0].activate();
        return $('#terminal-field').on('keydown', function(e) {
          var _ref6;
          if (e.keyCode === 13) {
            return (_ref6 = Try.get('currentStep')) != null ? _ref6.check(this.value) : void 0;
          }
        });
      });
    }
  });

}).call(this);
