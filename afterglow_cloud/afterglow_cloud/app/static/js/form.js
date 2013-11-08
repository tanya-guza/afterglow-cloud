
afterglow.form = {

    sumSourceSet : false,
    sumEventSet : false, 
    sumTargetSet : false,
    maxNodeSizeSet : false,

    /** Map with validators. Validators are functions that validate
        user input taking into account current state of the UI.
     */
    validators : {
        onRender : {
            /* Valited input source fieldset */
            inputSources : function(){
                var logType = $('input[name = "xLogType"]:checked').val();
                var isValid = true;
                            
                switch(logType){
                    case 'data':
                        isValid = afterglow.form
                            .validate('#id_dataFile') && isValid;
                        break;
                    case 'log':
                        isValid = afterglow.form
                            .validate('#id_dataFile') && isValid;

                        var regexType = $('input[name = "regExType"]:checked').val();
                        switch(regexType){
                            case '1':
                                isValid = afterglow.form
                                    .validate('#id_regEx') && isValid;

                                    if($('#id_saveRegEx').is(':checked')){
                                        isValid = afterglow.form.validate('#id_saveRegExName') && isValid;
                                        isValid = afterglow.form.validate('#id_saveRegExDescription', ['hasSpecifiedLength']) && isValid;
                                    }
                                break;
                            case '2':
                                isValid = afterglow.form
                                    .validate('#id_regExChoices', ['optionSelected'])  && isValid;
                                break;
                        }

                        return isValid;
                        break;
                    case 'loggly':
                        return afterglow.form
                            .validate('#id_logglySubdomain');
                        break;
                }

                return isValid;
            },

            /* Validates main settings fieldset */
            mainSettings : function(){
                afterglow.form.clearValidation("#mainSettings");
                var isValid = true;
                isValid = afterglow.form.validate('#id_textLabel', ['notEmpty']) && isValid;

                return isValid;
            },

            /* Validated advanced setttings fieldset */
            advancedSettings : function(){
                afterglow.form.clearValidation("#advancedSettings");
                var isValid = true;

                isValid = afterglow.form.validate('#id_skipLines', ['notEmpty', 'isInteger']) && isValid;
                isValid = afterglow.form.validate('#id_maxLines', ['notEmpty', 'isInteger']) && isValid;
                isValid = afterglow.form.validate('#id_omitThreshold', ['notEmpty', 'isInteger']) && isValid;
                isValid = afterglow.form.validate('#id_sourceFanOut', ['notEmpty', 'isInteger']) && isValid;
                isValid = afterglow.form.validate('#id_eventFanOut', ['notEmpty', 'isInteger']) && isValid;

                return isValid;
            },
        },

        /** Validators for configuration modal windows */
        nodeColour : function(){
                var isValid = true;
                isValid = afterglow.form.validate('#xColourType', ['optionSelected']) && isValid;
                isValid = afterglow.form.validate('#xColourHEX', ['notEmpty']) && isValid;

                var conditionType = $('input:radio[name=xColourRadio]:checked').val();

                switch(conditionType){
                    case 'none':
                        break;
                    case 'if':
                        isValid = afterglow.form.validate('#xColourIfCondition') && isValid;
                        break;
                    case 'custom':
                        isValid = afterglow.form.validate('#xColourCustomCondition') && isValid;
                        break;
                }

                return isValid;
        },

        nodeSize : function(){
            afterglow.form.clearValidation('#nodeSize');
            var isValid = true;
       
            if ( $("input[name='xSizeRadio']:checked").val() == "exp"){                    
                isValid = afterglow.form.validate('#xSizeCondition') && isValid;
            }

            isValid = afterglow.form.validate('#xThresholdType', ['optionSelected']) && isValid;

            return isValid;

        },

        nodeThreshold : function(){
            afterglow.form.clearValidation('#nodeThreshold');
            var isValid = true;

            isValid = afterglow.form.validate('#xThresholdType', ['optionSelected']) && isValid;
            isValid = afterglow.form.validate('#xThresholdSize', ['notEmpty', 'isInteger']) && isValid;

            return isValid;

        },

        nodeClustering : function(){
            var isValid = true;

            isValid =  afterglow.form.validate('#xClusteringType', ['optionSelected']) && isValid;

            var clusteringType = $("input[name='xClusteringRadio']:checked").val().toLowerCase();
          
            if(clusteringType == "exp"){
                isValid = afterglow.form.validate('#xClusteringCondition') && isValid;
            }else{
                isValid = afterglow.form.validate('#xClusteringPort', ['isInteger']) && isValid;
            }
            
            return isValid;
        },

        maxNodeSize : function(){
            return afterglow.form.validate('#xSizeMaxSize', ['notEmpty', 'isInteger']);
        },

        customLine : function(){
            return afterglow.form.validate('#xCustomCondition');
        }
    },

    /* Function to validate specified field with list of validate helpers */
    validate : function (field, conditions){

        if (conditions === undefined){
            conditions = ['notEmpty'];
        }

        var isValid = true;
        for(var i = 0; i < conditions.length; i++){
            isValid = isValid && afterglow.form.validateHelpers[conditions[i]](field);
            if (!isValid){
                break;
            }
        }

        if (!isValid){
            var invalidField = $('.validation-message[data-validation-for = "' + field  + '"]')
            var container = $('html,body');
            invalidField.show();
            $(document).scrollTop(
                invalidField.parent().parent().offset().top - $(invalidField).height()
            );
            console.log('Field "' + field + '" is NOT valid'); 
        } else {
            console.log('Field "' + field + '" is valid'); 
        }

        return isValid;
    },

    /* Functions that allow to validate field against some particular constraint */
    validateHelpers : {
        /* Returns true if field is not empty/blank */
        notEmpty : function(field){
            var value = $(field).val();
            return !(!value || /^\s*$/.test(value));
        },
        /* Returns true if there is an option selected in select input */
        optionSelected : function(field){
            return !!$(field).children('option:selected').length;
        },
        /* Returns true if field contains color in HTML format */
        htmlColor : function(field){
            var value = $(field).val();
            return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value);
        },
        /* Returns true if field contains positive integer number */
        isInteger : function(field){
            var value = $(field).val();
            return /^[0-9]+$/.test(value);
        },
        hasSpecifiedLength : function(field){
            var minLength = $(field).data('min-length');
            var maxLength = $(field).data('max-length');
            var value = $(field).val();
            var valid = true;

            if (value != undefined && value.length != 0){
                if (minLength != undefined){
                    valid = valid && value.length >= minLength;
                }

                if (maxLength != undefined){
                    valid = valid && value.length < maxLength;
                }
            }

            return valid;

        }

    },

    /**
    *   Hides all validation messages in the specified form/fieldset
    */
    clearValidation : function (fieldset){
        $(fieldset).find(".validation-message").hide();
    },

    eventHandlers : {
        addNodeColourRule : function(){
            afterglow.form.clearValidation("#nodeColour");
            if (afterglow.form.validators.nodeColour()){
                
                var addColourWindow = $('#nodeColour');

                var rawRule = "";
                var rule = "Node Colour";
                var hasCondition = addColourWindow.find('input:radio[name=xColourRadio]:checked').val() != 'none';
                var condition = $("#xColourIfCondition").val();
                var value = addColourWindow.find('#xColourHEX').val();
                var target = addColourWindow.find('select#xColourType').val();

                rawRule = rawRule + 'color';

                if (target != 'All'){
                    rawRule = rawRule + '.' + $("#xColourType").val().toLowerCase();
                }

                rawRule = rawRule + '="' + value + '"';

                if(hasCondition){
                    rawRule = rawRule + " if (" + condition + ") ";
                }
                afterglow.form.addRule(rawRule, rule + ' : ' + value, hasCondition? condition : 'none', target);
                
                return true;
            } else {
                return false;
            }
        },

        addNodeSizeRule : function(){
            afterglow.form.clearValidation("#nodeSize");
            if (afterglow.form.validators.nodeSize()){

                var rawRule = "";
                var rule = "Node Size";
                var target = $("#xSizeType").val().toLowerCase();
                var sizeType = $("input[name='xSizeRadio']:checked").val();
                var value = "";


                if( target == "all"){
                    rawRule = "size=";
                }else{
                    rawRule = "size." + target + "=";
                }


                if ( sizeType == "exp"){                    
                    value = $("#xSizeCondition").val();
                    rawRule +=  value;
                }else{

                    if(sizeType == "num"){
                        value = "$" + sizeType + "Count{$" + sizeType + "Name};";
                        rawRule += value;
                    
                    }else if(sizeType == "third"){
                        value = "$fields[2]";
                        rawRule += value;
                    }else{
                        value = "$fields[3]";
                        rawRule += value;
                    }

                }

                afterglow.form.addRule(rawRule, rule + ':' + value,'none', target);
                return true;
            } else {
                return false;
            }
        },

        addNodeThresholdRule : function(){
            afterglow.form.clearValidation("#nodeThreshold");
            if (afterglow.form.validators.nodeThreshold()){
                

                var rawRule = "";
                var rule = "Node Threshold";
                var target = $("#xThresholdType").val().toLowerCase();
                var value = $("#xThresholdSize").val();
                
                if($("#xThresholdType").attr("value") == "all"){

                    rawRule = "threshold=" + value;
                
                }else{
                
                    rawRule = "threshold." + target + "=" + value;
                }


                afterglow.form.addRule(rawRule, rule + ' : ' + value, 'none', target);
                return true;
            } else {
                return false;
            }
        },

        addNodeClusteringRule : function(){
            afterglow.form.clearValidation("#nodeClustering");
            if (afterglow.form.validators.nodeClustering()){

                var rawRule = '';
                var target = $("#xClusteringType").val().toLowerCase();
                var clusteringType = $("input[name='xClusteringRadio']:checked").val();
                var value = "";
                var rule = "Node Clustering";
                
                userHTML = "Cluster :: " + $("#xClusteringType").attr("value");
                
                if(target == "all"){
                    rawRule = "cluster=";        
                }else{
                    rawRule = "cluster." + target + "=";    
                }
                
                if (clusteringType == "ip"){
                    
                    var clusteringIPType =  $("#xClusteringIPType").val();
                
                    if(clusteringIPType == "a"){
                        value = 'regex_replace("(\\\\d\\+)\\\\.\\\\d\\+")."/8"';
                        rawRule += value;
                    }else if(clusteringIPType == "b"){
                        value = 'regex_replace("(\\\\d\\+\\\\.\\\\d\\+)\\\\.\\\\d\\+")."/16"';
                        rawRule += value;
                    }else{
                        value = 'regex_replace("(\\\\d\\+\\\\.\\\\d\\+\\\\.\\\\d\\+)\\\\.\\\\d\\+")."/24"';
                        rawRule += value;
                    }
                    
                    
                }else if(clusteringType == "exp"){
                    value = $("#xClusteringCondition").val();
                    rawRule += value;
                
                }else{
                    
                    value = $("#xClusteringPort").attr("value");
                    rawRule += '\"> ' + value + '\" if ($fields[2]>' + value + ')';
                }
                
                afterglow.form.addRule(rawRule, rule + ' : ' + value, 'none', target);
                return true;
            } else {
                return false;
            }
        },

        addMaxNodeSize : function(){
            afterglow.form.clearValidation("#maxNodeSize");
            if (afterglow.form.validators.maxNodeSize()){
                
                var rule = "Max Node Size(Global)";
                var value = $("#xSizeMaxSize").val();
                var rawRule = "maxnodesize=" + value;
                var maxNodeSizeSet = afterglow.form.maxNodeSizeSet;

                if (!maxNodeSizeSet){
                    afterglow.form.maxNodeSizeSet = true;
                    afterglow.form.addRule(rawRule, rule + ' : ' + value, 'none', 'n/a', function(){
                       afterglow.form.maxNodeSizeSet = false;
                       $('#addMaxNodeSizeBtn').prop('disabled', false);
                    });

                    $('#addMaxNodeSizeBtn').prop('disabled', true);
                }
    
                return true;
            } else {
                return false;
            }
        },


        addNodeSum : function(){    
            var rawRule = "";
            var rule = "Node Sum(Global)";
            var target = $("#xSumType").val();

            var sumSourceSet = afterglow.form.sumSourceSet;
            var sumEventSet = afterglow.form.sumEventSet;
            var sumTargetSet = afterglow.form.sumTargetSet;

            //Check for individual sum setting (determine which one has been set) and
            //proceed only if the one requested hasn't been already set.
            if( target == "Source" && !sumSourceSet){
                rawRule = "sum.source=1;";
                afterglow.form.sumSourceSet = true;
                afterglow.form.addRule(rawRule, rule, 'none', target, function(){
                    afterglow.form.sumSourceSet = false;
                    $('#addNodeSumBtn').prop('disabled', false);
                });
            }else if(target == "Event" && !sumEventSet){
                rawRule = "sum.event=1;"
                afterglow.form.sumEventSet = true;
                afterglow.form.addRule(rawRule, rule, 'none', target, function(){
                   afterglow.form.sumEventSet = false; 
                   $('#addNodeSumBtn').prop('disabled', false);
                });
            }else if(target == "Target" && !sumTargetSet){
                rawRule = "sum.target=1;";
                afterglow.form.sumTargetSet = true;
                afterglow.form.addRule(rawRule, rule, 'none', target, function(){
                    afterglow.form.sumTargetSet = false;
                    $('#addNodeSumBtn').prop('disabled', false);
                });
            }

            if (afterglow.form.sumSourceSet && afterglow.form.sumTargetSet && afterglow.form.sumEventSet){
                $('#addNodeSumBtn').prop('disabled', true);
            }


            return true;
           
        },

        addCustomLine : function(){
            afterglow.form.clearValidation("#customLine");
            if (afterglow.form.validators.customLine()){
                var rule = "Custom";
                var rawRule = $("#xCustomCondition").val();
    
                afterglow.form.addRule(rawRule, rule, rawRule, 'n/a');
                
                return true;
            } else {
                return false;
            }
        }
    },

    moveRuleUpHandler : function(){
        var row = $(this).parents("tr:first");
        var configLineId = row.attr('id').substring('added-rule-'.length);
        var hiddenDiv = $('#added-hidden-rule-'  + configLineId);

        row.insertBefore(row.prev());
        hiddenDiv.insertBefore(hiddenDiv.prev());
    },
    moveRuleDownHandler : function(){
        var row = $(this).parents("tr:first");
        var configLineId = row.attr('id').substring('added-rule-'.length);
        var hiddenDiv = $('#added-hidden-rule-'  + configLineId);

        row.insertAfter(row.next());
        hiddenDiv.insertBefore(hiddenDiv.next());
    },
    removeRuleHandler : function(){
        var row = $(this).parents("tr:first");
        var configLineId = row.attr('id').substring('added-rule-'.length);
        var hiddenDiv = $('#added-hidden-rule-'  + configLineId);  

        row.remove();
        hiddenDiv.remove();
    },

    addRule : function(rawRule, rule, condition, target, deleteHandler){
        var uid = Math.random().toString(36).substr(2,9);
        afterglow.form.addRuleToTable(rule, condition, target, uid, deleteHandler);
        afterglow.form.addRuleToConfig(rawRule, uid);
    },

    addRuleToTable : function(rule, condition, target, uid, deleteHandler){
        var index = $('#alreadyAddedRules').find('tr').length + 1;
        var actions = '<p class="text-center"><a href="#" class="icon-arrow-up" title="Move rule up"></a>';
        actions += '<a href="#" class="icon-arrow-down"  title="Move rule down"></a>';
        actions += '<a href="#" class="icon-trash"  title="Remove rule"></a></p>';
        var rowString = '<tr id="added-rule-' + uid + '">' + 
                    '<td>' + rule + '</td>' +
                    '<td>' + condition + '</td>' +
                    '<td>' + target + '</td>' +
                    '<td class="text-center">' + actions + '</td>' +
                  '</tr>';

        var row = $('#alreadyAddedRules').first('tbody').append(rowString);

        row.find('a.icon-arrow-up').click(afterglow.form.moveRuleUpHandler);
        row.find('a.icon-arrow-down').click(afterglow.form.moveRuleDownHandler);
        row.find('a.icon-trash').click(afterglow.form.removeRuleHandler);

        if (deleteHandler != 'undefined'){
            row.find('a.icon-trash').click(deleteHandler);
        }
    },

    addRuleToConfig : function(rule, uid){

        var configLine = document.createElement("div");
        configLine.id = "added-hidden-rule-" + uid;
        configLine.innerHTML = rule;
        $("#alreadyAddedHidden").append(configLine);
    },

    handleAddRuleClick : function(originalHandler){
        var handleFunction  = function(){
            if (originalHandler()){
                $(this).parent().modal('hide');
            }
        }

        return handleFunction;

    },

    initModalWindows : function(){
        $('#nodeColour').find('.add-rule-button').click(afterglow.form.handleAddRuleClick(
            afterglow.form.eventHandlers.addNodeColourRule));
        $('#nodeSize').find('.add-rule-button').click(afterglow.form.handleAddRuleClick(
            afterglow.form.eventHandlers.addNodeSizeRule));
        $('#nodeThreshold').find('.add-rule-button').click(afterglow.form.handleAddRuleClick(
            afterglow.form.eventHandlers.addNodeThresholdRule));
        $('#nodeClustering').find('.add-rule-button').click(afterglow.form.handleAddRuleClick(
            afterglow.form.eventHandlers.addNodeClusteringRule));
        $('#customLine').find('.add-rule-button').click(afterglow.form.handleAddRuleClick(
            afterglow.form.eventHandlers.addCustomLine));
        $('#nodeSum').find('.add-rule-button').click(afterglow.form.handleAddRuleClick(
            afterglow.form.eventHandlers.addNodeSum));
        $('#maxNodeSize').find('.add-rule-button').click(afterglow.form.handleAddRuleClick(
            afterglow.form.eventHandlers.addMaxNodeSize));
    },

    saveConfiguration : function(){

        var value = "";
        
       
        if($('input[name=xConfigType]:checked').val() == "manual"){
        
            value = $("#xManualConfig").attr("value");

        }else if($('input[name=xConfigType]:checked').val() == "prev"){
        
            value = $("#xPropertyConfigPopulate").val();

        }else{
        
            for (var i = 0; i < $("#alreadyAddedHidden").children().length; i++){
                value += $($("#alreadyAddedHidden").children()[i]).text() + "\n"; 
            }
            
        }
        
        console.log(value);
        $("#id_propertyConfig").val(value);
    },

    init : function(){

        $('.close-modal').click(function(){
            $(this).closest('.custom-config-window').modal('hide');
        });
        
        /** Input sources validation reset*/
        $('#inputSources').children().change(function(){
            afterglow.form.clearValidation("#inputSources,#loggly,#file,#regExInputs,#saveRegExDetails");
        });

        $('#regex').children().change(function(){
            afterglow.form.clearValidation("#regExInputs");
        });

        $('#saveRegExDetails').children().change(function(){
            afterglow.form.clearValidation("#saveRegExDetails");
        });

        afterglow.form.initModalWindows();

        $('#xRenderProcess').click(function(){
            afterglow.form.clearValidation('#renderMainForm');
            
            var isValid = true;
            for(var validator in afterglow.form.validators.onRender){
                if (afterglow.form.validators.onRender.hasOwnProperty(validator)){
                    isValid = afterglow.form.validators.onRender[validator]() && isValid;
                }
            }

            if (isValid){
                afterglow.form.saveConfiguration();
            }

            return isValid;

        });
    }
}

$(function(){
    afterglow.form.init();
});