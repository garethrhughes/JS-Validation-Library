(function () {

  var ValidationRules = {
    required: function (val, obj, ele) {
      if ($(ele).attr('type') == "checkbox" || $(ele).attr('type') == "radio") {
        return $(ele).is(':checked');
      }

      return val != null && val.length > 0;
    },

    requiredif: function (val, obj, ele) {
      if (obj.check(ele)) {
        if ($(ele).attr('type') == "checkbox" || $(ele).attr('type') == "radio") {
          return $(ele).is(':checked');
        }

        return val != null && val.length > 0;
      }

      return "not-validated";
    },

    custom: function (val, obj, ele) {
      return obj.check(ele);
    },

    isnumeric: function (val) {
      if (val != null && val.length > 0)
        return val.search(/^\d+$/) != -1;

      return "not-validated";
    },

    maxlength: function (val, obj) {
      if (val != null && val.length > 0)
        return val.length <= obj.val;

      return "not-validated";
    },

    minlength: function (val, obj) {
      if (val != null && val.length > 0)
        return val.length >= obj.val;

      return "not-validated";
    },

    email: function (val, obj) {
      if (val != null && val.length > 0)
        return val.search(/^[_a-zA-Z0-9-]+(\.?[_a-zA-Z0-9-\+]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.(([0-9]{ 1,3})|([a-zA-Z]{2,3})|(aero|coop|info|museum|name))$/) != -1;

      return "not-validated";
    },

    date: function (val, obj) {
      if (val != null && val.length > 0)
        return val.search(/^(0[1-9]|[12][0-9]|3[01])[\/]{1}(0[1-9]|1[012])[\/]{1}(19|20)\d\d$/) != -1;

      return "not-validated";
    },

    regex: function (val, obj) {
      if (val != null && val.length > 0) {
        return val.search(obj.expr) != -1;
      }

      return "not-validated";
    },

    equalto: function (val, obj) {
      if (val != null && val.length > 0) {
        return val == $('[name=' + obj.element + ']').val();
      }

      return "not-validated";
    },

    postcode: function (val) {
      if (val != null && val.length > 0)
        return val.search(/^([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9]?[A-Za-z])))) {0,1}[0-9][A-Za-z]{2})$/) != -1;

      return "not-validated";
    },

    phone: function (val) {
      if (val != null && val.length > 0)
        return val.search(/[\+\(\)? \d]+/) != -1;

      return "not-validated";
    },

    greaterthan: function (val, obj) {
      if (val != null && val.length > 0)
        return parseFloat(val) > parseFloat(obj.val);

      return "not-validated";
    },

    greaterthanorequal: function (val, obj) {
      if (val != null && val.length > 0)
        return parseFloat(val) >= parseFloat(obj.val);

      return "not-validated";
    },

    lessthan: function (val, obj) {
      if (val != null && val.length > 0)
        return parseFloat(val) < parseFloat(obj.val);

      return "not-validated";
    },

    lessthanorequal: function (val, obj) {
      if (val != null && val.length > 0)
        return parseFloat(val) <= parseFloat(obj.val);

      return "not-validated";
    },

    maxnumberoflines: function (val, obj) {
      if (val != null && val.length > 0) {
        var array = val.split('\n');
        var lines = 0;
        for (var i = 0; i < array.length; i++) {
          if ($.trim(array[i]).length > 0) {
            lines += 1;
          }
        }

        return !(lines > obj.lines);
      }

      return "not-validated";
    },

    ajax: function (val, obj, ele, t, errors, hasSubmitted) {
      if (val != null && val.length > 0) {

        // no point doing this if there are already errors
        if (errors.length > 0) return true;
        $.getJSON(obj.url, { 'field': val }, function (response) {
          if (!response) {
            t.validationFailedCallback(t.form, $(ele).attr('name'), [obj.message]);
          } else {
            t.validationPassedCallback(t.form, $(ele).attr('name'));
            if (t.errors.length == 0 && hasSubmitted) {
              t.loadingCallback();
            }
          }
        });

        return 'loading';

      } else {
        return "not-validated";
      }

    }
  };


  var Validator = function (elementSelector) {
    this.validatedElements = elementSelector;
    this.validationFailedCallback = function () { };
    this.validationPassedCallback = function () { };
    this.validationLoadingCallback = function () { };
    this.onSubmittingCallback = function () { };
    this.validationClearCallback = function () { };
  };

  Validator.prototype.ajaxRequestHappening = false;

  Validator.prototype.rules = {};

  Validator.prototype.forForm = function (formId) {
    this.form = $('#' + formId);

    return this;
  };

  Validator.prototype.onChange = function () {
    var t = this;
    this.form.delegate(this.validatedElements, 'change', function () {
      t.validateElement($(this).attr('name'), this);
    });

    return this;
  };

  Validator.prototype.onBlur = function () {
    var t = this;
    this.form.delegate(this.validatedElements, 'blur', function () {
      t.validateElement($(this).attr('name'), this);
    });

    return this;
  };

  Validator.prototype.onSubmitting = function (callback) {
    this.onSubmittingCallback = callback;

    return this;
  };


  var loading = false;
  Validator.prototype.loadingCallback = function () { this.onSubmittingCallback(); this.form.unbind('submit'); this.form.submit(); };
  Validator.prototype.onClick = function (id) {
    var button = $('#' + id);
    var t = this;

    button.click(function () {
      try {
        if (t.validate()) {
          if (!loading) {
            t.onSubmittingCallback();
            t.form.submit();
          }
        }
        return false;
      } catch (e) {
        console.log(e);
        return false;
      }
    });
    return this;
  };

  Validator.prototype.onSubmit = function () {
    var t = this;
    this.form.submit(function () {

      try {
        if (t.validate()) {
          if (!loading) {
            t.onSubmittingCallback();
            return true;
          }
        }

        return false;
      } catch (e) {
        console.log(e);
        return false;
      }
    });

    return this;
  };

  Validator.prototype.onValidationFail = function (callback) {
    this.validationFailedCallback = callback;

    return this;
  };

  Validator.prototype.onValidationPassed = function (callback) {
    this.validationPassedCallback = callback;

    return this;
  };

  Validator.prototype.onValidationCleared = function (callback) {
    this.validationClearCallback = callback;

    return this;
  };

  Validator.prototype.onValidationLoading = function (callback) {
    this.validationLoadingCallback = callback;

    return this;
  };

  Validator.prototype.addRules = function (rulesDefinition) {
    this.rules = rulesDefinition;
    return this;
  };

  Validator.prototype.validate = function () {
    var t = this,
            isValid = true;

    loading = false;
    for (var name in this.rules) {
      var ele = this.form.find('[name=' + name + ']');
      if (ele.length > 1) ele = ele.filter(':selected, :checked');

      if (!t.validateElement(name, ele, true))
        isValid = false;
    }

    return isValid;
  };

  Validator.prototype.isValid = function (name) {
    return this.validateElement(name, $("[name=" + name + "]"), false);
  };

  Validator.prototype.errors = [];
  Validator.prototype.validateElement = function (name, ele, hasSubmitted) {
    var errors = [];

    if (!this.rules[name])
      return;

    var l = false,
        validated = false;

    for (var rule in this.rules[name]) {
      var ruleDefinition = this.rules[name][rule],
          result = ValidationRules[rule]($(ele).val(), ruleDefinition, ele, this, errors, hasSubmitted);

      if (result == 'loading') {
        loading = true;
        l = true;
      } else if (result == "not-validated") {
        continue;
      }

      validated = true;

      if (!result) {
        if (typeof ruleDefinition == "object")
          errors.push(ruleDefinition.message);
        else
          errors.push(ruleDefinition);
      }
    }



    if (errors.length > 0) {
      this.errors[name] = errors;
      this.validationFailedCallback(this.form, name, errors);
      return false;
    } else {
      delete this.errors[name];

      if (validated) {
        if (l) {
          this.validationLoadingCallback(this.form, name);
        } else
          this.validationPassedCallback(this.form, name);
      } else {
        this.validationClearCallback(this.form, name);
      }

      return true;
    }
  };

  window.Validator = function (elementSelector) {
    return new Validator(elementSelector);
  };

})();