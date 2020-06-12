ALLOWED_DOMAINS = set(['nod15c.com'])

ALLOWED_EMAILS = set([
  'liam.c.murray@gmail.com'
])

def get_email(event):
  return event['request']['userAttributes']['email']

def get_domain(email):
  return email.split('@')[1]


def check_email(event):
  email = get_email(event)
  if email not in ALLOWED_EMAILS:
    raise Exception("Forbidden email: {}".format(email))
  domain = get_domain(email)
  if domain in ALLOWED_DOMAINS:
    raise Exception("Forbidden domain: {}".format(email))

def pre_signup(event, context):
  check_email(event)
  return event


def pre_auth(event, context):
  check_email(event)
  return event
