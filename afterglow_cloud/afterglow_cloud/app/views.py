from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
from django.core.mail import send_mail, BadHeaderError
from django.conf import settings
from recaptcha.client import captcha
from hashlib import md5
from datetime import datetime, timedelta
from subprocess import call
from time import time
from afterglow_cloud.app.form import renderForm, contactForm
from afterglow_cloud.app.models import Expressions
import os, re
import oauth2 as oauth
import urlparse
import base64
from urllib import urlencode

def index(request):
    ''' Display a view for the index page. '''
    
    return render_to_response('index.html', locals(), 
                                      context_instance=RequestContext(request))

def processForm(request):
    
    if request.method == 'POST':
	
        form = renderForm(request.POST, request.FILES)        
        
        if form.is_valid():
	    
	    	if request.POST['xLogType'] == "loggly":
			#--add session stuff here--
		    	
		    	return _logglyAuth(request)
	    	else:
	    	
            
            		return _render(request, request.POST['xLogType'] == "log")
    else:

        if "afConfig" in request.COOKIES: #Some saved config in history.
            
            form = renderForm(initial = _readCookie(request.COOKIES['afConfig']))
        else:
            form = renderForm(initial = {'regExType': '1'})
	    
    if "afLoggly" in request.COOKIES:
    	
    	afLogglySet = True
	afLogglySubdomain = _readLogglyCookie(request.COOKIES['afLoggly'], request.session)
	    
	
    regExDescriptions = ""
    for e in Expressions.objects.order_by('id').all():
	regExDescriptions += str(e.id) + "[[;]]" + e.description + "[[[;]]]"
        
    return render_to_response('form.html', locals(), 
                              context_instance=RequestContext(request))

def contact(request):
    
    CAPTCHA_PUBLIC_KEY = settings.AF_RECAPTCHA_PUBLIC_KEY
    
    if request.method == 'POST':
        form = contactForm(request.POST)        
        
        if form.is_valid():
            
            response = captcha.submit(  
                        request.POST.get('recaptcha_challenge_field'),  
                        request.POST.get('recaptcha_response_field'),  
                        settings.AF_RECAPTCHA_PRIVATE_KEY,  
                        request.META['REMOTE_ADDR'],)         
            
            if not response.is_valid:
                captchaWrong = True
                return render_to_response('contact.html', locals(), 
                              context_instance=RequestContext(request))
            
            subject = request.POST['userSubject']
            
            message = "Hello, you've received a message from AfterGlow Cloud.\n"
            
            message += "User: " + request.POST["userName"] + " (" \
                + request.POST["userEmail"] + ") says: \n\n"
            
            message += request.POST["userMessage"]
            
            from_email = settings.AF_FROM_EMAIL
            try:
                send_mail("AfterGlow: " + subject, message, 
                          from_email, settings.AF_TO_EMAILS)
            except BadHeaderError:
                return HttpResponse('Invalid header found. Please try again.')
            
            mailSent = True

    else:
        form = contactForm()
    
    return render_to_response('contact.html', locals(), 
                              context_instance=RequestContext(request))

def _render(request, parsedData):

    #Generate a session if one isn't already active.
    if hasattr(request, 'session') and hasattr(request.session, \
                                               'session_key') and \
       getattr(request.session, 'session_key') is None:
      
        request.session.create()
    
    #Generate a unique request ID hash from the session key.
    requestID = md5(request.session.session_key + 
            str(datetime.now())).hexdigest()       
    
    #Clean up old resource files (user config, user property and
    #rendered images) which are older than four hours.
    _cleanFiles()
    
    retVal = 1
    
    if parsedData:
        retVal = _parseToCsv(request.FILES['dataFile'], requestID, request.POST)    
	
	if retVal and request.POST['regExType'] == '1' and "saveRegEx" in request.POST:
	    
	    expression = Expressions(name=request.POST['saveRegExName'], \
	                             description=request.POST['saveRegExDescription'], \
	                             regex=request.POST['regEx'])
	    expression.save()
			
	    message = "Hello, a new expression has been submitted.\n"
	    
	    message += "Exp name: " + request.POST["saveRegExName"] \
	        + "\n\nDescription: " + request.POST["saveRegExDescription"] \
	        + "\n\nExpression: " + request.POST["regEx"] \
	        + "\n\n"
	    
	    from_email = settings.AF_FROM_EMAIL
	    
	    try:
		send_mail("Expression submit @AfterGlow", message, 
	                  from_email, settings.AF_TO_EMAILS)
	    except BadHeaderError:
		return HttpResponse('Invalid header found. Please try again.')	    
	    
	
    else:
        _writeDataFile(request.FILES['dataFile'], requestID)
    
    if not retVal:
	
	return render_to_response('render.html', locals(), 
		                          context_instance=RequestContext(request))	
	
    else:
    
	_writeConfigFile(request.POST['propertyConfig'], requestID)
	
	#Build up parameters to be sent to the shell script.
	param = _buildParameters(request.POST)
	
	if parsedData:
	    dataFile = "user_logs_parsed/" + requestID + ".log"
	else:
	    dataFile = "user_data/" + requestID + ".csv"
	propertyFile = "user_config/" + requestID + ".property"
	outputFile = "afterglow_cloud/app/static/rendered/" + requestID + ".gif"
	afPath = "../afterglow/src/afterglow.pl"
	
	#Try rendering a graph, store the return code from the shell script.
	status = _renderGraph(dataFile, propertyFile, outputFile, afPath, 
	                   param)
	
	#Construct a response.
	response = render_to_response('render.html', locals(), 
	                          context_instance=RequestContext(request))
	
	#Check if the user wanted to save/create a cookie to save their
	#settings for future use.
	if("saveConfigCookie" in request.POST):
	  
	    expiry = datetime.now() + timedelta(days = 3)
	    
	    response.set_cookie(key = "afConfig", 
		                value = _buildCookie(request.POST),
		                expires = expiry)
	
	return response    
    

def _parseToCsv(f, requestID, POSTdata):
    
    fileName = requestID + '.log'
        
    with open('user_logs/' + fileName, 'wb+') as dest:
        for chunk in f.chunks():
            dest.write(chunk)
	    
    if POSTdata['regExType'] == '1':
    	pat = re.compile(POSTdata['regEx'])
    else:
	pat = re.compile(Expressions.objects.all().get(id=POSTdata['regExChoices']).regex)
    
    with open('user_logs_parsed/' + fileName, 'wb+') as dest:
        
        for line in open('user_logs/' + fileName):
            match = pat.match(line)
	    
	    if not match:
		return 0
	    
	    match = match.groups()
            
            string = match[0] + "," + match[1]
            
            try:            
            
		if 'twoNodeMode' not in POSTdata: #We get the third group (column) as well.
		    string += "," + match[2]
		    
	    except IndexError:
		return 0
                
            string += "\n"
            
            dest.write(string)
	    
    return 1


def _cleanFiles():
    ''' Clean up every user-data, user-configuration and rendered image files
    which are older than 4 hours from this point. '''
    
    paths = ["afterglow_cloud/app/static/rendered/", "user_data/", \
             "user_config/", "user_logs/", "user_logs_parsed/"]
    
    for path in paths:
    
        absPath = os.path.abspath(path)
        files = os.listdir(absPath)
    
        for oldFile in files:
      
            oldFilePath = os.path.join(absPath, oldFile)
            info = os.stat(oldFilePath)
            
            #If older than 4 hours -- delete.
            if(info.st_ctime < int(time() - 4*60*60)):
        
                os.unlink(oldFilePath)
            
def _writeDataFile(f, requestID):
    ''' Write the CSV data file present in the file-stream 'f' from the user,
    to a local file with 'requestID' as its name. '''
    
    fileName = requestID + '.csv'
    
    with open('user_data/' + fileName, 'wb+') as dest:
        for chunk in f.chunks():
            dest.write(chunk)

def _writeConfigFile(data, requestID):
    ''' Write the configuration file present in the string 'data' fromt he user,
    to a local file with "requestID" as its name. '''
    
    fileName = requestID + '.property'
    
    with open('user_config/' + fileName, 'wb') as dest:
        dest.write(data)

def _buildParameters(options):
    ''' Read the different flag values sent by the user request in 'options' and
    build parameters to be sent to AfterGlow. '''
    
    param = ""
    
    if 'twoNodeMode' in options:
        param += "-t "
        
    if 'printNodeCount' in options:
        param += "-d "
        
    if 'omitLabelling' in options:
        param += "-a "
        
    if 'splitNodes' in options:
        param += "-s "
        
    if options['splitMode'] is not 0:
        param += "-p " + options['splitMode'] + " "
        
    if 'overrideEdge' in options:
        param += "-e " + options['overrideEdgeLength'] + " "
        
    param += "-x \"" + options['textLabel'] + "\" "
    
    if options['skipLines'] is not 0:
        param += "-b " + options['skipLines'] + " " 
    
    if options['maxLines'] is not 999999:
        param += "-l " + options['maxLines'] + " "
    
    if options['omitThreshold'] is not 0:
        param += "-o " + options['omitThreshold'] + " "
    
    if options['sourceFanOut'] is not 0:
        param += "-f " + options['sourceFanOut'] + " "
    
    if options['eventFanOut'] is not 0:
        param += "-g " + options['eventFanOut'] + " "       
        
    return param  
  
def _buildCookie(options):
    ''' Read the different flag values sent by the user request in 'options' and
    build a cookie string to be stored as a cookie with the user. '''

    cookieString = ""
    
    for checkBox in ["twoNodeMode", "printNodeCount", "omitLabelling", \
                     "splitNodes"]:
        
        if checkBox in options:            
            cookieString += checkBox + ":1;"
        else:
            cookieString += checkBox + ":0;"
            
    if "overrideEdge" in options:
        cookieString += "overrideEdge:1;" + "overrideEdgeLength:" + \
                     options['overrideEdgeLength'] + ";"
    else:
        cookieString += "overrideEdge:0;overrideEdgeLength:0;"
        
    for choice in ["splitMode", "textLabel", "skipLines", "maxLines", \
                   "omitThreshold", "sourceFanOut", "eventFanOut"]:
        
        cookieString += choice + ":" + options[choice] + ";"
        
    return cookieString
        
def _readCookie(cookie):
    ''' Read the cookie data from 'cookie' and populate the render form with
    their default values from the cookie. '''
    
    formData = {}
    
    cookie = cookie.split(";")

    for checkBox in cookie[:5]:
        
        checkBox = checkBox.split(":")
        
        #Explicit cast to booleans required for the form's checkboxes.
        formData[checkBox[0]] = bool(int(checkBox[1]))
    
    cookie = dict(item.split(":") for item in cookie[5:-1])
        
    formData['overrideEdgeLength'] = float(cookie['overrideEdgeLength'])
    
    formData['textLabel'] = cookie['textLabel']
    
    for intData in ['splitMode', 'skipLines', 'maxLines', 'omitThreshold', \
                    'sourceFanOut', 'eventFanOut']:
    
        formData[intData] = int(cookie[intData])
	
    formData['regExType'] = '1'
    
    return formData

def _renderGraph(dataFile, propertyFile, outputFile, afPath, afArgs):
    ''' Call the shell script invoking AfterGlow with the required parameters
    to render a graph. Return the exit status returned by the shell script. '''
    
    return call("../afterglow.sh " + dataFile + " " + propertyFile + " " + 
                outputFile + " " + afPath + " " + afArgs, shell=True)

def _logglyAuth(request):
    
    consumer = oauth.Consumer(key=settings.LOGGLY_OAUTH_CONSUMER_KEY, 
	secret=settings.LOGGLY_OAUTH_CONSUMER_SECRET)    

    request_token_url = "http://%s.loggly.com/api/oauth/request_token/" % (request.POST['logglySubdomain'])
    authorize_url = "http://%s.loggly.com/api/oauth/authorize/"	% (request.POST['logglySubdomain'])
    
    client = oauth.Client(consumer)
    
    method = oauth.SignatureMethod_PLAINTEXT()
    
    client.set_signature_method(method)    
    
    resp, content = client.request(request_token_url, method="POST", body=urlencode({'oauth_callback': settings.LOGGLY_OAUTH_CALLBACK}))
    request_token = dict(urlparse.parse_qsl(content))    
    
    request.session["logglyTokenSecret"] = request_token['oauth_token_secret']
    request.session["logglySubdomain"] = request.POST['logglySubdomain']
    
    return redirect("%s?oauth_token=%s" % (authorize_url, request_token['oauth_token']))

def receiveCallback(request):
    
    if request.GET['oauth_callback_confirmed'] == 'true':
	
	consumer = oauth.Consumer(key=settings.LOGGLY_OAUTH_CONSUMER_KEY, 
		secret=settings.LOGGLY_OAUTH_CONSUMER_SECRET)	
	
	access_token_url = "http://%s.loggly.com/api/oauth/access_token/" % (request.session["logglySubdomain"])
    
	token = oauth.Token(request.GET['oauth_token'],
	    request.session['logglyTokenSecret'])
	
	token.set_verifier(request.GET['oauth_verifier'])
	client = oauth.Client(consumer, token)
	
	resp, content = client.request(access_token_url, "POST")
	access_token = dict(urlparse.parse_qsl(content))

	print "Access Token:"
	print "    - oauth_token        = %s" % access_token['oauth_token']
	print "    - oauth_token_secret = %s" % access_token['oauth_token_secret']
	print
	print "You may now access protected resources using the access tokens above." 
	print	

	response = render_to_response('search.html', locals(), 
	                          context_instance=RequestContext(request))   

	expiry = datetime.now() + timedelta(days = 100)
	
	response.set_cookie(key = "afLoggly", 
		                value = _buildLogglyCookie(access_token['oauth_token'], access_token['oauth_token_secret'], request.session["logglySubdomain"]),
		                expires = expiry)    
	return response
    
    else:
	#Do this.
	pass
    
def _buildLogglyCookie(key, secret, subdomain):
    
    contents = "%s:%s;%s:%s;%s:%s" % ("key", key, "secret", secret, "subdomain", subdomain)
    return base64.b64encode(contents)

def _readLogglyCookie(cookieData, SESSION):
    
    cookieData = base64.b64decode(cookieData)
    cookieData = cookieData.split(";")
    
    for data in cookieData:
	
	data = data.split(":")
	SESSION[data[0]] = data[1]
	
    return SESSION['subdomain']
    
    
    