#!/usr/bin/env python
#-*- coding:utf-8 -*-

import os, sys
import sqlite3
import csv
import datetime
from xml.parsers import expat

try:
    from tkinter import *
except ImportError:
    from Tkinter import *



class Work:

    def __init__ (self, name, parent = None):
        self.parent = parent
        self.name = name


    def GetName (self):
        return self.name



class Agent:

    def __init__ (self, name, work = None, parent = None):
        self.parent = parent
        self.work = work
        self.name = name
        self.starttime = None
        self.periodstarttime = None
        self.duration = datetime.timedelta(0)


    def ResetAgent (self):
        self.work = None
        self.starttime = None
        self.periodstarttime = None
        self.duration = datetime.timedelta(0)


    def SetWork (self, work):
        self.work = work


    def SetTime (self):
        self.periodstarttime = datetime.datetime.now()
        if not self.starttime:
            self.starttime = datetime.datetime.now()


    def PauseTime (self):
        if not self.periodstarttime:
            return False

        self.duration += datetime.datetime.now() - self.periodstarttime
        self.periodstarttime = None
        return str(self.duration)


    def GetWork (self):
        return self.work


    def GetName (self):
        return self.name


    def GetStartTime (self):
        return self.starttime


    def GetPeriodStartTime (self):
        return self.periodstarttime


    def GetDuration (self):
        self.PauseTime()

        ret = str(self.duration)
        self.duration = datetime.timedelta(0)
        return ret



class App:

    def __init__ (self, agents, works, parent = None):

        self.agents = []
        for i in xrange (len(agents)):
            self.agents.append (Agent (agents[i]["name"], None, self))

        self.works = []
        for i in xrange (len(works)):
            self.works.append (Work (works[i]["name"], self))

        self.current_agent = -1
        self.current_work = -1

        self.InitDatabase()


    def InitDatabase (self):
        self.conn = sqlite3.connect ("output.db")
        self.c = self.conn.cursor()
        self.c.execute ('''CREATE TABLE IF NOT EXISTS duration 
                (id integer primary key autoincrement, agent string,
                work string, duration string, starttime string, endtime string)''')
        self.c.execute ('''CREATE TABLE IF NOT EXISTS pause 
                (id integer primary key autoincrement, agent string,
                work string, duration string, starttime string, endtime string)''')
        self.conn.commit()

    
    def SetAgent (self, agent):
        if self.agents[agent].GetStartTime():
            self.StopTimer (agent)
            return -1

        self.current_agent = agent
        print "current_agent: " + self.agents[agent].GetName()

        if self.current_work == -1:
            return -2

        work = self.current_work
        self.StartTimer()
        return work


    def PauseAgent (self, agent):
        if self.agents[agent].GetWork() == None:
            return 0

        duration = self.agents[agent].PauseTime()

        if duration:
            self.c.execute ('''INSERT INTO pause (agent, work, duration, starttime, endtime)
                VALUES (?, ?, ?, ?, ?)''', (self.agents[agent].GetName(),
                    self.works[self.agents[agent].GetWork()].GetName(),
                    duration, str(self.agents[agent].GetStartTime()), str(datetime.datetime.now())))
            self.conn.commit()
            return 1
        else:
            self.agents[agent].SetTime()
            return 2


    def SetWork (self, work):
        self.current_work = work
        print "current_work: " + self.works[work].GetName()

        if self.current_agent == -1:
            return -2

        agent = self.current_agent
        self.StartTimer()
        return agent


    def StartTimer (self):
        self.agents[self.current_agent].SetWork (self.current_work)
        self.agents[self.current_agent].SetTime()
        print "start timer: " + self.works[self.current_work].GetName() + " @ " + self.agents[self.current_agent].GetName()

        self.current_work = -1
        self.current_agent = -1


    def StopTimer (self, agent):
        duration = self.agents[agent].GetDuration()
        print "stop timer: " + self.works[self.agents[agent].GetWork()].GetName() + " @ " + self.agents[agent].GetName() + " for " + duration

        if duration:
            self.c.execute ('''INSERT INTO duration (agent, work, duration, starttime, endtime)
                VALUES (?, ?, ?, ?, ?)''', (self.agents[agent].GetName(),
                    self.works[self.agents[agent].GetWork()].GetName(),
                    duration, str(self.agents[agent].GetStartTime()), str(datetime.datetime.now())))
            self.conn.commit()

        self.agents[agent].ResetAgent()
        self.current_agent = -1
        self.current_work = -1


    def Exit (self):

        with open ('duration.csv', 'wb') as f:
            writer = csv.writer(f)
            writer.writerow (['id', 'agent', 'work', 'duration', 'starttime', 'endtime'])
            for row in self.c.execute ('SELECT * FROM duration'):
                writer.writerow (row)

        with open ('pause.csv', 'wb') as f:
            writer = csv.writer(f)
            writer.writerow (['id', 'agent', 'work', 'duration', 'starttime', 'endtime'])
            for row in self.c.execute ('SELECT * FROM pause'):
                writer.writerow (row)

        self.conn.commit()
        self.conn.close()



class Application (Frame):

    def __init__ (self, master = None):

        Frame.__init__ (self, master)

        self.agents = []
        self.works = []
        self.ParseXML()

        self.app = App (self.agents, self.works, self)
        self.pack()
        self.CreateWidgets()


    def start_element (self, name, attrs):
        self.element = name

        if name == "agent":
            self.agents.append ({
                "name": attrs["name"],
                "background": attrs["background"],
                "width": attrs["width"],
                "height": attrs["height"]
                })
        elif name == "work":
            self.works.append ({
                "name": attrs["name"],
                "background": attrs["background"],
                "width": attrs["width"],
                "height": attrs["height"]
                })
        elif name == "colorInWork":
            self.ColorInWork = attrs["value"]
        elif name == "colorPaused":
            self.ColorPaused = attrs["value"]


    def end_element (self, name):
        self.element = None


    def char_data (self, char):
        if self.element == "strFree":
            self.strFree = char
        elif self.element == "strWorking":
            self.strWorking = char
        elif self.element == "strPause":
            self.strPause = char
        elif self.element == "strPaused":
            self.strPaused = char


    def ParseXML (self):
        self.ColorInWork = "red"
        self.ColorPaused = "yellow"
        self.strFree = " is free"
        self.strWoring = " on "
        self.strPause = "Pause"
        self.strPaused = " is paused"
        self.element = None

        p = expat.ParserCreate()
        p.StartElementHandler = self.start_element
        p.EndElementHandler = self.end_element
        p.CharacterDataHandler = self.char_data
        p.ParseFile (open ("input.xml", "rb"))


    def CreateWidgets (self):

        self.AgentButtons = []
        self.AgentPauseButtons = []
        for i in xrange(len(self.agents)):
            button = Button (self)
            button["text"] = self.agents[i]["name"] + self.strFree
            button["bg"] = self.agents[i]["background"]
            button["command"] = lambda i = i: self.SetAgent (i)
            button["relief"] = RAISED
            button["width"] = self.agents[i]["width"]
            button["height"] = self.agents[i]["height"]
#            button.pack()
            button.grid (row = i, column = 0)

            self.AgentButtons.append (button)

            button = Button (self)
            button["text"] = self.strPause
            button["bg"] = self.agents[i]["background"]
            button["command"] = lambda i = i: self.SetAgentPause (i)
            button["relief"] = RAISED
            button["width"] = 20
            button["height"] = self.agents[i]["height"]
#            button.pack()
            button.grid (row = i, column = 1)

            self.AgentPauseButtons.append (button)

        self.WorkButtons = []
        for i in xrange(len(self.works)):
            button = Button (self)
            button["text"] = self.works[i]["name"]
            button["bg"] = self.works[i]["background"]
            button["command"] = lambda i = i: self.SetWork (i)
            button["relief"] = RAISED
            button["width"] = self.works[i]["width"]
            button["height"] = self.works[i]["height"]
#            button.pack()
            button.grid (row = i, column = 2)

            self.WorkButtons.append (button)


    def SetAgent (self, num):
        self.AgentsAllRaised()
        self.AgentButtons[num]["relief"] = SUNKEN

        work = self.app.SetAgent (num)
        if work == -1: # When StopTimer is called
            self.AgentsAllRaised()
            self.WorksAllRaised()
            self.AgentButtons[num]["text"] = self.agents[num]["name"] + self.strFree
            self.AgentButtons[num]["bg"] = self.agents[num]["background"]
        elif work >= 0:
            self.AgentButtons[num]["text"] = self.agents[num]["name"] + self.strWorking + self.works[work]["name"]
            self.AgentButtons[num]["bg"] = self.ColorInWork


    def SetAgentPause (self, num):
        ret = self.app.PauseAgent (num)

        if ret == 1:
            self.AgentButtons[num]["text"] = self.agents[num]["name"] + self.strPaused
            self.AgentButtons[num]["bg"] = self.ColorPaused
        elif ret == 2:
            self.AgentButtons[num]["text"] = self.agents[num]["name"] + self.strWorking + self.works[self.app.agents[num].GetWork()]["name"]
            self.AgentButtons[num]["bg"] = self.ColorInWork
        else:
            return False


    def SetWork (self, num):
        self.WorksAllRaised()
        self.WorkButtons[num]["relief"] = SUNKEN

        agent = self.app.SetWork (num)
        if agent >= 0:
            self.AgentButtons[agent]["text"] = self.agents[agent]["name"] + self.strWorking + self.works[num]["name"]
            self.AgentButtons[agent]["bg"] = self.ColorInWork


    def AgentsAllRaised (self):
        for i in xrange(len(self.agents)):
            self.AgentButtons[i]["relief"] = RAISED


    def WorksAllRaised (self):
        for i in xrange(len(self.works)):
            self.WorkButtons[i]["relief"] = RAISED



if __name__ == "__main__":
    root = Tk()
    app = Application (master = root)
    app.mainloop()

    app.app.Exit()

    try:
        root.destroy()
    except:
        pass
