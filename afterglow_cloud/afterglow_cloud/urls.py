from django.conf.urls import patterns, include, url

urlpatterns = patterns('afterglow_cloud.app.views',
     url(r'^process$', 'processForm'),
     url(r'^render/(?P<json_hash>\w+)$', 'renderGraph'),
     url(r'^$', 'index'),
     url(r'^contact$', 'contact'),
     url(r'^callback$', 'receiveCallback'),
     url(r'^revoke$', 'revokeAccess'),
     url(r'^search$', 'logglySearch'),
     url(r'^gallery-submit$', 'galleryProcess'),
     url(r'^gallery$', 'showGallery'),
)
