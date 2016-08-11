#!/usr/bin/env python
import requests
import time
import re
import sys
import getpass
from bs4 import BeautifulSoup
import argparse

def liveSession( html ):
    if ( html is not None ):
        return
    run = True
    while run:
        time.sleep(1)
        soup = BeautifulSoup(html, "html.parser")
        script = soup.script.string
        arrayString = re.('"([^"]*)"', script)
        url = arrayString[0]
        html = requests.get(url).text
    return

def logout():
    requestLogout = requests.get('https://gateway.iitk.ac.in:1003/logout?0501030a00253727')
    time.sleep(1)
    print "Logout"
    return str(requestLogout.status_code)

def login(logout_status_code):
    if re.match('(200)|(303)', logout_status_code) is not None :

        soup = BeautifulSoup(requests.get('http://www.google.com').text , "html.parser")

        Magic = soup.find("input", {'name': "magic"}).attrs['value']
        Tredir = soup.find("input", {'name': "4Tredir"}).attrs['value']

        # UserName = raw_input('IITK user name:')
        # Password = getpass.getpass('Password:')

        payload = {'4Tredir': Tredir, 'magic': Magic, 'username': 'kshivang', 'password': 'Kuchnaya'}

        f = requests.post('https://gateway.iitk.ac.in:1003', data = payload);

        soup = BeautifulSoup(f.text , "html.parser")
        if soup.h2.string is not None:
            str = soup.h2.string
            print str
            substr = 'again'
            if substr in str:
                return None
        print "Fortinet Logged in!"
        return f.text

    print "Internet connection Problem!"
    return None

def auto():
    html = login(logout())
    while(True):
        time.sleep(50)
        liveSession( html )
    return

def test(dummy):
    print dummy
    return

parser = argparse.ArgumentParser()
subparsers = parser.add_subparsers()

parser_test = subparsers.add_parser('test')
parser_test.add_argument('string', help='simply print whatever argument it take')
parser_test.set_defaults(func=test)

parser_auto = subparsers.add_parser('auto', help='Do fortinet login automatically')
parser_auto.set_defaults(func=auto)

parser_logout = subparsers.add_parser('logout', action='store_true', help='Logout fortinet')
parser_logout.set_defaults(func=logout)

parser_test = subparsers.add_parser('live')
parser_test.add_argument('string', help='for maintaing live session require magic code')
parser_test.set_defaults(func=liveSession)

args = parser.parse_args()

# print len( vars(args))
if (len( vars(args)) > 1):
    args.func(args.string)
    exit()

args.func()

