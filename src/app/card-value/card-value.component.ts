import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { DataService } from '../services/data/data.service';
import { SEOService } from '../services/seo/seo.service';
import { SkillInfo, CardInfo } from '../model/card-statistics';

@Component({
  selector: 'app-card-value',
  templateUrl: './card-value.component.html',
  styleUrls: ['./card-value.component.scss']
})
export class CardValueComponent implements OnInit {
  //from route param
  char;
  id;
  lang;

  //from data service
  charRssGroup;
  card: any;
  skillLevelUpRssList;  //lv2-lv10, index 0-8
  skillList;
  allSkillList;

  //skill rss
  coin = 0;
  rss = [0, 0, 0, 0, 0, 0];
  lv = 100;

  //for localStorage
  userData;
  hasUserData = false;
  star = 1;
  att = 0;
  def = 0;
  skills = [1, 1, 1];
  skillsInfo = ["", "", ""];
  power = 0;

  isLoaded = false;

  constructor(private _route: ActivatedRoute, private _data: DataService, private _seoService: SEOService) { }

  ngOnInit(): void {
    this.id = this._route.snapshot.params.id;
    this.char = this._route.snapshot.params.charname;

    this.lang = localStorage.getItem('language')
    this.userData = JSON.parse(this._data.getItem(this.id))

    this._data.getCard(this.id).toPromise().then((card: any) => {
      this._data.getSkills().toPromise().then((skills: any[]) => {
        this.allSkillList = skills;
        this.setCardWithLang(card)
        this.setTitle();
        this.charRssGroup = SkillInfo.getSkillRssGroup(this.card.character);
        this.att = card.influence
        this.def = card.defense
        if (card.rarity == "R") {
          this.lv = 70
        }
        this.power = CardInfo.calculatePower(this.card.rarity, this.star, this.skills);
        this._data.getSkillRssList().toPromise().then((data: any[]) => {
          data.forEach(d => {
            if (d.rarity == this.card.rarity) {
              this.skillLevelUpRssList = d.rss
            }
          })
          //if localStorage has user's data for this card
          if (this.userData) {
            this.loadUserData();
          }
        }).catch(err => console.log(err))
        if (this.card) {
          this.loadSkillInfo()
        }

        this.isLoaded = true;
      })
    });
  }

  loadUserData(){
    this.hasUserData = true;
    this.skills = this.userData.skills
    this.star = this.userData.star
    this.calculateRss()
    this.calculateCardStatistic()
    this.power = CardInfo.calculatePower(this.card.rarity, this.star, this.skills);
  }

  //set card's information based on user's choice for language
  setCardWithLang(data: any) {
    if ('en' == this.lang) {
      data.char = data.characterEN != '' ? data.characterEN : data.character
      data.n = data.nameEN != '' ? data.nameEN : data.name

      let skills = []
      data.skills.forEach(name => {
        this.allSkillList.forEach((d: any) => {
          if (name == d.name || name == d.nameEN) {
            d.n = d.nameEN != '' ? d.nameEN : d.name
            d.des = d.descriptionEN != '' ? d.descriptionEN : d.description
            skills.push(d)
          }
        })
      });
      data.skills = skills
    } else {
      data.char = data.character
      data.n = data.name

      let skills = []
      data.skills.forEach(name => {
        this.allSkillList.forEach((d: any) => {
          if (name == d.name) {
            d.n = d.name
            d.des = d.description
            skills.push(d)
          }
        })
      });
      data.skills = skills
    }
    this.card = data;
  }

  setTitle() {
    let pre = '思绪'
    if ('en' == this.lang) {
      pre = 'Card'
    }
    this._seoService.setTitle(`${pre}：${this.card.n}`);
  }

  loadSkillInfo() {
    let list = []
    this.card.skills.forEach(s => {
      this.allSkillList.forEach(d => {
        if (d.name == s.name) {
          list.push(d)
        }
      })
    })
    this.skillList = list
    this.setSkillDisplay();
  }

  //set the string of skills that being display on the page
  setSkillDisplay() {
    this.skillsInfo = []
    let r = 3;
    if (this.card.rarity == "R") {
      r = 2
    }
    for (let i = 0; i < r; i++) {
      let skill = this.card.skills[i]
      let num = (this.skills[i] - 1) * (skill.nums[1] - skill.nums[0]) / 9 + skill.nums[0]
      //replace X in the description with correct number
      let line = skill.des.toString()
      let str = line.replace("X", num.toFixed(2).toString())
      this.skillsInfo.push(str);
    }
  }

  //calculate the rss cost for leveling skills
  calculateRss() {
    for (let i = 0; i < 3; i++) {
      let lvl = this.skills[i]
      if (lvl > 1) {
        //lv2: index 0, lv10: index 8
        for (let j = 0; j < lvl - 1; j++) {
          this.coin += this.skillLevelUpRssList[j].coin
          //lv2-4
          if (j < 3) {
            this.rss[0] += this.skillLevelUpRssList[j].impression
            this.rss[1] += this.skillLevelUpRssList[j].item
          }
          //lv5-7
          else if (j < 6) {
            this.rss[2] += this.skillLevelUpRssList[j].impression
            this.rss[3] += this.skillLevelUpRssList[j].item
          }
          //lv8-10
          else {
            this.rss[4] += this.skillLevelUpRssList[j].impression
            this.rss[5] += this.skillLevelUpRssList[j].item
          }
        }
      }
    }
  }

  calculateCardStatistic() {
    let x = 1 + (this.star - 1) * 0.1
    this.att = Math.round(this.att * x)
    this.def = Math.round(this.def * x)
  }

  deleteUserData() {
    localStorage.removeItem(this.card.id)
    console.log(`${this.card.id} is deleted`)
  }
}
