#! /usr/bin/env perl

use strict;
use warnings;

print <<EOS ;
using System;
using System.Collections.Generic;
using System.Linq;
using mtgen.ViewModels;

public class Main1
{
    public static void Main()
	{
		mtgen.ViewModels.Set Model = new mtgen.ViewModels.Set();

EOS

while(<>) {
	if(/\@model Set$/) {
		$_ = <>;
		if(/^\@\{/) {
			process_set_lines();
		}
	}
}

print <<EOS ;

		Model.to_json();
	}
}
EOS

sub process_set_lines {
	my $depth = 1;
	my $data = '';

	while(<>) {
		my $line_copy = $_;

		# get rid of comments
		s=//.*$==;
		
		# get rid of strings
		s/".*?"//g;

		foreach my $char (split //) {
			if($char eq '{') {
				$depth++;
			}

			if($char eq '}') {
				$depth--;
				if($depth == 0) {
					die "mehy: $_" unless ($line_copy =~ /^\}$/);
					print $data;
					return;
				}
			}
		}
		
		$data .= $line_copy;
	}
}
