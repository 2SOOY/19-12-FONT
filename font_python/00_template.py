# -*- coding: utf-8 -*-
# make 399 Template file

from __future__ import print_function
from __future__ import absolute_import

import sys
import numpy as np
from PIL import Image
from PIL import ImageDraw
from PIL import ImageFont


reload(sys)
sys.setdefaultencoding("utf-8")

KR_CHARSET = None

y_margin = 100


def draw_single_char(ch, font, char_size, x_offset, y_offset):
    # ch : 유니코드 문자 / font : 폰트 / char_size : 글자 사이즈 / offset : 마진

    img = Image.new("RGB", (char_size, y_margin), (255, 255, 255))

    # 한 글자에 해당하는 캔버스 (빈)
    draw = ImageDraw.Draw(img)
    a = draw.text((x_offset, y_offset), ch, (0, 0, 0), font=font)
    # 빈 캔버스 위에 글자 쓰기 (TopLeft, 글자, 색상, 폰트 )
    return img


def makeTemplate (charset, font, space, outputName='output.png'):
    y_margin = 100
    src_font = ImageFont.truetype(font, size=75)
    canvas = Image.new("RGB", ( space*12, (space + y_margin) * 12), (255,255,255))
    x_pos = 0 # col
    y_pos = 0 # row

    # draw character
    for c in charset:
        cImg = draw_single_char(c, src_font, space ,x_offset=100, y_offset=0) # (100,0) 위치에서 시작
        canvas.paste(cImg, ( x_pos*space, y_pos*(space + y_margin) ))
        x_pos = x_pos + 1
        if x_pos >= 12:
            x_pos = 0
            y_pos = y_pos + 1

    draw = ImageDraw.Draw(canvas)


    # draw Line

    # outline
    draw.line( [ (0, 0),
                 (space * 12, 0),
                 (space * 12, (space + y_margin) * 12),
                 (0, (space + y_margin) * 12),
                 (0, 0) ]

              , fill=(0, 0, 0), width=30)

    # inline
    for i in range(11):
        draw.line([((i + 1) * space, 0), ((i + 1) * space, ((space + y_margin) * 12) )], fill=(0, 0, 0), width=15)


    for i in range(12):
        draw.line([(0, (i + 1) * (space+y_margin)), (space * 12, (i + 1) * (space+y_margin))], fill=(0, 0, 0),
                  width=15)

    for i in range(11):
        draw.line([(0, y_margin + (i + 1) * (space + y_margin)), (space * 12, y_margin +  (i + 1) * (space + y_margin))],
                  fill=(0, 0, 0), width=15)

    draw.line([(0, y_margin),
               (space * 12, y_margin )],
              fill=(0, 0, 0),
              width=15)

    canvas.save(outputName)



def select_sample(charset):
    # this returns 399 samples from KR charset
    # we selected 399 characters to sample as uniformly as possible
    # (the number of each ChoSeong is fixed to 21 (i.e., 21 Giyeok, 21 Nieun ...))
    # Given the designs of these 399 characters, the rest of Hangeul will be generated
    samples = []
    for i in range(399):
        samples.append(charset[28 * i + (i % 28)])
    #        samples.append(charset[28*i+(i%28)+14])
    return samples

def chunksList(List,size):
    for i in range(0, len(List), size):
        yield List[i : i + size]



if __name__ == "__main__":
    charset = []
    # 유니코드 : 11,172자
    for i in range(0xac00, 0xd7a4):
        charset.append(unichr(i))

    # template 399자
    charset = select_sample(charset)

    charset_ = list(chunksList(charset,144))
    charset1 = charset_[0]
    charset2 = charset_[1]
    charset3 = charset_[2]

    makeTemplate(charset1, '/usr/share/fonts/truetype/nanum/NanumGothic.ttf', space=256, outputName='output1.png')
    makeTemplate(charset2, '/usr/share/fonts/truetype/nanum/NanumGothic.ttf', space=256, outputName='output2.png')
    makeTemplate(charset3, '/usr/share/fonts/truetype/nanum/NanumGothic.ttf', space=256, outputName='output3.png')
