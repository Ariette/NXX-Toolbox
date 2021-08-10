import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SEOService } from '../services/seo/seo.service';
import { Apollo, gql } from 'apollo-angular';

const GET_MERCH = gql`
  query GetMerch($query: MerchQueryInput!){
    merch(query: $query){
      _id
        images
        name
        price
        productSize
        productMaterial
        productTechnology
        productPacking
        productDescription
        sellDate
        series{
          name
          type
          sellTime
        }
        tmall
        weibo
        hoyolab
    }
  }
`;

@Component({
  selector: 'app-merch-detail',
  templateUrl: './merch-detail.component.html',
  styleUrls: ['./merch-detail.component.scss']
})
export class MerchDetailComponent implements OnInit {
  _id;
  lang;

  merch;
  isLoaded = false;

  constructor(private _route: ActivatedRoute, private _apollo: Apollo, private _seoService: SEOService) { }

  ngOnInit(): void {
    this._id = this._route.snapshot.queryParamMap.get('id') as String;
    this.lang = localStorage.getItem('language');
    this.loadData();
  }

  loadData() {
    return this._apollo.query({
      query: GET_MERCH,
      variables: {
        query: { _id: this._id }
      },
    }).toPromise().then((result: any) => {
      this.merch = result.data.merch;
      this.setTitle();
      this.isLoaded = true;
    });
  }

  setTitle() {
    let pre = '周边';
    if ('en' == this.lang) {
      pre = 'Merch';
    } else if ('ko' == this.lang) {
      pre = '굿즈';
    }
    this._seoService.setTitle(`${pre}：${this.merch.name}`);
  }
}