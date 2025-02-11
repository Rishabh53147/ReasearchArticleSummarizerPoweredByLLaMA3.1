# Reasearch Article Summarizer powered by LLaMA 3.1

Following project is our team's final year project for bachelor degree in computer science. The project consists of two sections -- the user interface and the LLM model. as of Making this repository the project is still under development and the deadline for completion of the base prototype is december 2024. This project a research article summarizer that uses the arXiv API to access the latest reasearch in mathematics, science and computer science. the user interface allows anyone to filter out these paper in whichever way they desire. The main purpose of this project is to use the LLaMA 3.1 model to summarize the articles into more precise and easy to understand point such that users need not waste time in reading hundreds of article and only read the the ones where they might find interest as per their own topic.

## Table of Contents

- [Introduction](#introduction)
- [Model](#model)
- [Dataset](#dataset)
- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)


## Introduction
We're developing this project for the purpose of making it less time consuming and efficient for students and scholars alike to do reasearch survey over scientific articles. We as students always have multiple projects each semester that have a tight deadline, to do these projects we ofcourse need to do proper research in the field on which the project is based. Reading research article and analysing their findings. this task of survey 10 to 50 papers is a very time consuming method especially for students who need to repeat it for multiple projects. Hence why we introduce this application that makes it easier for articles to be summarized and shown in a efficient manner that can make it easier for the user to analyse and generate inference from them.

## Model
The model is the backbone of this project and is used to summarize the main article. The model we have choosen for this project is LLaMA 3.1 (as of current development). We had compared multiple models over our dataset to see which one produces the most cohesive results. We have specifically choosen LLaMA 3.1-8B-instruct which can be fine tuned to give the result that we desire without the need of further prompting.
LLaMA -- [https://ai.meta.com/blog/meta-llama-3-1/]
Our Comparative Analysis of various Models -- FNTCT - 06

## Dataset
The dataset that we have used to the LLM model is the mirror dataset of arXiv available on kaggle. arXiv is a free, open-access repository of scientific research papers, it is a collection of early versions of research papers that are not yet peer-reviewed or published in journals. It covers a wide range of scientific disciplines such as Physics, Mathematics and Computer Science. The dataset is a collection of 7.1 B+ english articles and it includes fields such as the paper's ID, submitter, authors, title, and comments.
Dataset -- [https://www.kaggle.com/datasets/Cornell-University/arxiv]


## Installation
```sh
git clone https://github.com/Rishabh53147/ReasearchArticleSummarizerPoweredByLLaMA3.1.git
cd ReasearchArticleSummarizerPoweredByLLaMA3.1
```

## Usage
step - 1
```sh
node server.js
```
step - 2
```sh
npm start
```
