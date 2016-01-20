iris.app.get("/admin/schema", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_schema"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

iris.app.get("/admin/schema/:type", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_schema"], ['admin_wrapper'], {
    entityType: req.params.type
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

iris.app.get("/admin/schema/:type/:field", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_schema_field"], ['admin_wrapper'], {
    entityType: req.params.type,
    field: req.params.field
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

iris.modules.entity.registerHook("hook_form_render_schema", 0, function (thisHook, data) {

  if (thisHook.const.params[1]) {

    var entityType = thisHook.const.params[1];

    if (!iris.dbSchema[entityType]) {

      iris.message(thisHook.authPass.userid, "No such entity type", "error");

      thisHook.finish(false, data);

      return false;

    } else {

      var entityTypeSchema = iris.dbSchema[entityType];

      data.value.fields = [];

      var specialFields = ["entityType", "entityAuthor", "eid"];

      Object.keys(entityTypeSchema).forEach(function (fieldName) {

        if (specialFields.indexOf(fieldName) !== -1) {

          return false;

        }

        var field = JSON.parse(JSON.stringify(iris.dbSchema[entityType][fieldName]));

        delete field.type;

        field.about = "<br /><a class='btn btn-info' href='/admin/schema/" + entityType + "/" + fieldName + "'>Edit field settings</a>";

        data.value.fields.push(field);

      })


    }

  };

  data.schema = {
    "title": {
      "type": entityType ? "hidden" : "text",
      "title": "Entity type name"
    },
    "fields": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "about": {
            "type": "markup",
            "markup": ""
          },
          "fieldType": {
            "type": "text",
            "title": "Field type",
            "description": "This affects how this field is stored in the database.",
            "enum": Object.keys(iris.fieldTypes)
          },
          "machineName": {
            "type": "text",
            "title": "Database name",
            "description": "What this field will be called in the database. Lowercase letters and underscores only."
          },
          "label": {
            "type": "text",
            "title": "Field label"
          },
          "description": {
            "type": "textarea",
            "title": "Field description"
          },
          "permissions": {
            "type": "checkboxbuttons",
            "activeClass": "btn-success",
            "title": "Field view permissions",
            "items": {
              "enum": Object.keys(iris.modules.auth.globals.roles)
            }
          }
        }
      }
    }
  }

  thisHook.finish(true, data);

})

// Register form for editing a field's deeper settings

iris.modules.entity.registerHook("hook_form_render_schemafield", 0, function (thisHook, data) {

  var entityType = thisHook.const.params[1];
  var fieldName = thisHook.const.params[2];

  if (iris.dbSchema[entityType] && iris.dbSchema[entityType][fieldName]) {

    var field = iris.dbSchema[entityType][fieldName];

    var fieldTypeForm = iris.fieldTypes[field["fieldType"]].form;
    
    data.schema = fieldTypeForm;
    
    thisHook.finish(true, data);

  } else {

    thisHook.finish(false, data);

  }


});

// Register markup form field

iris.modules.forms.globals.registerWidget(function () {

  JSONForm.elementTypes['markup'] = Object.create(JSONForm.elementTypes['text']);

  JSONForm.elementTypes['markup'].template = '<%= value ? value : node.schemaElement.markup  %>';
  JSONForm.elementTypes['markup'].fieldTemplate = true;
  JSONForm.elementTypes['markup'].inputfield = true;


}, "markup");

iris.modules.entity.registerHook("hook_form_submit_schema", 0, function (thisHook, data) {

  iris.saveConfig(thisHook.const.params, "entity", iris.sanitizeFileName(thisHook.const.params.title), function (data) {

    console.log("saved");

  })

  iris.dbPopulate();

  data = function (res) {

    res.send({
      "redirect": "/admin/schema/" + iris.sanitizeFileName(thisHook.const.params.title)
    })

  }

  thisHook.finish(true, data);

})
